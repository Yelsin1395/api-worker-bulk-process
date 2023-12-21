import { Schema, model } from 'mongoose';

const LoggerSchema = new Schema(
  {
    tipo: {
      type: String,
      require: true,
    },
    token: {
      type: Array,
    },
  },
  { timestamps: true }
);

export default model('logger', LoggerSchema);
