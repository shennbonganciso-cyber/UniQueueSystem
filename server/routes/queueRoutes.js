const express = require("express");
const {
  createQueueTicket,
  deleteQueueTicket,
  getQueueTicketById,
  getQueueTickets,
  updateQueueTicket,
} = require("../controllers/queueController");

const router = express.Router();

router.get("/", getQueueTickets);
router.get("/:id", getQueueTicketById);
router.post("/", createQueueTicket);
router.put("/:id", updateQueueTicket);
router.delete("/:id", deleteQueueTicket);

module.exports = router;
