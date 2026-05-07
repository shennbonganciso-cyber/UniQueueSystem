const mongoose = require("mongoose");
const QueueCounter = require("../models/QueueCounter");
const QueueTicket = require("../models/QueueTicket");

const SERVICE_PREFIX = {
  consultation: "M",
  documentation: "D",
};

const SERVICE_NAME = {
  consultation: "Consultation",
  documentation: "Administrative Request",
};

const ACTIVE_STATUSES = ["waiting", "serving", "skipped"];
const ALLOWED_STATUS_TRANSITIONS = {
  waiting: ["serving", "skipped", "completed"],
  serving: ["completed", "skipped"],
  skipped: ["waiting", "completed"],
  completed: [],
  cancelled: [],
};

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatQueueNumber(serviceType, sequence) {
  return `${SERVICE_PREFIX[serviceType]}-${String(sequence).padStart(3, "0")}`;
}

function emitQueueChanged(req, action, ticket) {
  const io = req.app.get("io");

  if (!io) return;

  io.emit("queues:changed", {
    action,
    ticketId: ticket?._id,
    serviceType: ticket?.serviceType,
    dateKey: ticket?.dateKey,
    timestamp: new Date().toISOString(),
  });
}

function buildQueueFilter(query) {
  const { date, status, serviceType, studentId } = query;
  const filter = {};

  if (date === "today") {
    filter.dateKey = getDateKey();
  }

  if (status) {
    filter.status = status;
  }

  if (serviceType) {
    filter.serviceType = serviceType;
  }

  if (studentId) {
    filter.studentId = studentId;
  }

  return filter;
}

async function getNextQueueNumber(serviceType, dateKey, session) {
  const counter = await QueueCounter.findOneAndUpdate(
    { serviceType, dateKey },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    }
  );

  return formatQueueNumber(serviceType, counter.sequence);
}

async function getQueueTickets(req, res, next) {
  try {
    const tickets = await QueueTicket.find(buildQueueFilter(req.query)).sort({
      serviceType: 1,
      createdAt: 1,
    });

    res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
}

async function getQueueTicketById(req, res, next) {
  try {
    const ticket = await QueueTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Queue ticket not found" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

async function createQueueTicket(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const ticket = await session.withTransaction(async () => {
      const { studentName, studentId, serviceType, notes } = req.body;

      if (!studentName || !studentId || !serviceType) {
        const error = new Error("studentName, studentId, and serviceType are required");
        error.status = 400;
        throw error;
      }

      if (!SERVICE_PREFIX[serviceType]) {
        const error = new Error("Invalid serviceType");
        error.status = 400;
        throw error;
      }

      const dateKey = getDateKey();
      const existingTicket = await QueueTicket.findOne({
        studentId,
        serviceType,
        dateKey,
        status: { $in: ACTIVE_STATUSES },
      }).session(session);

      if (existingTicket) {
        const error = new Error("You already have an active ticket for this service today");
        error.status = 409;
        error.ticket = existingTicket;
        throw error;
      }

      const queueNumber = await getNextQueueNumber(serviceType, dateKey, session);
      const [createdTicket] = await QueueTicket.create(
        [
          {
            studentName,
            studentId,
            serviceType,
            serviceName: SERVICE_NAME[serviceType],
            queueNumber,
            dateKey,
            notes,
            status: "waiting",
          },
        ],
        { session }
      );

      return createdTicket;
    });

    emitQueueChanged(req, "created", ticket);
    res.status(201).json(ticket);
  } catch (error) {
    if (error.status === 409 && error.ticket) {
      return res.status(409).json({
        message: error.message,
        ticket: error.ticket,
      });
    }

    next(error);
  } finally {
    session.endSession();
  }
}

async function updateQueueTicket(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const ticket = await session.withTransaction(async () => {
      const existingTicket = await QueueTicket.findById(req.params.id).session(session);

      if (!existingTicket) {
        const error = new Error("Queue ticket not found");
        error.status = 404;
        throw error;
      }

      const requestedStatus = req.body.status;
      const updates = {};

      if (typeof req.body.notes === "string") {
        updates.notes = req.body.notes;
      }

      if (requestedStatus) {
        const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[existingTicket.status] ?? [];

        if (!allowedNextStatuses.includes(requestedStatus)) {
          const error = new Error(
            `Invalid status transition from ${existingTicket.status} to ${requestedStatus}`
          );
          error.status = 409;
          throw error;
        }

        if (requestedStatus === "serving") {
          const activeServingTicket = await QueueTicket.findOne({
            _id: { $ne: existingTicket._id },
            serviceType: existingTicket.serviceType,
            dateKey: existingTicket.dateKey,
            status: "serving",
          }).session(session);

          if (activeServingTicket) {
            const error = new Error("Another queue ticket is already being served for this service");
            error.status = 409;
            throw error;
          }
        }

        updates.status = requestedStatus;
      }

      const updatedTicket = await QueueTicket.findOneAndUpdate(
        {
          _id: existingTicket._id,
          status: existingTicket.status,
        },
        { $set: updates },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updatedTicket) {
        const error = new Error("Queue ticket changed before the update completed");
        error.status = 409;
        throw error;
      }

      return updatedTicket;
    });

    emitQueueChanged(req, "updated", ticket);
    res.status(200).json(ticket);
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
}

async function deleteQueueTicket(req, res, next) {
  try {
    const ticket = await QueueTicket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Queue ticket not found" });
    }

    emitQueueChanged(req, "deleted", ticket);
    res.status(200).json({ message: "Queue ticket deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getQueueTickets,
  getQueueTicketById,
  createQueueTicket,
  updateQueueTicket,
  deleteQueueTicket,
};
