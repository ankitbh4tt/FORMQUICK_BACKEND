import mongoose, { Schema, Document } from 'mongoose';

interface ResponseField {
  label: string;
  value: string | number | boolean | string[];
}

interface IResponse extends Document {
  formId: string;
  submitterId?: string; // Clerk userId, optional for anonymous submissions
  responses: ResponseField[];
  createdAt: Date;
}

const ResponseSchema: Schema<IResponse> = new Schema(
  {
    formId: { type: String, required: true },
    submitterId: { type: String }, // Optional
    responses: [
      {
        label: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Response || mongoose.model<IResponse>('Response', ResponseSchema);