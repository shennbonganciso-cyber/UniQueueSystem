const mongoose = require("mongoose");

const queueTicketSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      trim: true,
      required: true,
    },
    studentId: {
      type: String,
      trim: true,
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["consultation", "documentation"],
      required: true,
    },
    serviceName: {
      type: String,
      trim: true,
      required: true,
    },
    queueNumber: {
      type: String,
      trim: true,
      required: true,
    },
    dateKey: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "serving", "completed", "skipped", "cancelled"],
      default: "waiting",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

queueTicketSchema.index(
  { dateKey: 1, serviceType: 1, queueNumber: 1 },
  { unique: true }
);
queueTicketSchema.index({ dateKey: 1, serviceType: 1, status: 1 });
queueTicketSchema.index(
  { dateKey: 1, studentId: 1, serviceType: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["waiting", "serving", "skipped"] },
    },
  }
);

module.exports = mongoose.model("QueueTicket", queueTicketSchema);
