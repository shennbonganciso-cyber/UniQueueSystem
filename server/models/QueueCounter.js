const mongoose = require("mongoose");

const queueCounterSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: ["consultation", "documentation"],
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

queueCounterSchema.index({ serviceType: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("QueueCounter", queueCounterSchema);
