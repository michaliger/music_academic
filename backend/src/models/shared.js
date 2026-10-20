import { Schema } from 'mongoose';

// JSON output: expose `id`, hide internals and the password hash.
const transform = (_doc, ret) => {
  ret.id = String(ret._id);
  delete ret._id; delete ret.__v; delete ret.passwordHash;
  return ret;
};

/** Schema options with an explicit collection name (matches the task's table names). */
export const options = (collection, extra = {}) => ({ collection, toJSON: { transform }, ...extra });

/** Required reference to another model. */
export const ref = (model) => ({ type: Schema.Types.ObjectId, ref: model, required: true });
