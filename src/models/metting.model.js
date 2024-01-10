import { Schema, model } from 'mongoose';

const MettingSchema = new Schema(
  {
    number: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default model('metting', MettingSchema);
