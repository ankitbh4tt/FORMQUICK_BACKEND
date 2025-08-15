import mongoose, { Schema, Document } from 'mongoose';

// Interface for individual form field
export interface FormField {
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'checkbox' | 'file';
  required: boolean;
  options?: string[];
}

// Interface for the Form document
interface IForm extends Document {
  title: string;
  description?: string;
  fields: FormField[];
  owner: string; // Clerk userId
  createdAt: Date;
  updatedAt: Date;
}

// Subschema for FormField
const FormFieldSchema: Schema = new Schema({
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'number', 'email', 'date', 'select', 'checkbox', 'file'],
    required: true,
  },
  required: { type: Boolean, required: true },
  options: {
    type: [String],
    required: function () {
      // @ts-ignore
      return this.type === 'select';
    },
    validate: {
      validator: function (value: string[]) {
        // @ts-ignore
        return this.type !== 'select' || (Array.isArray(value) && value.length > 0);
      },
      message: 'Select fields must have non-empty options array',
    },
  },
},
{ _id: false } // No _id for subdocuments
);

// Prevent duplicate labels in fields
FormFieldSchema.pre('validate', function (next) {
  // @ts-ignore
  const form = this.parent();
  if (form && form.fields) {
    const labels = form.fields.map((field: FormField) => field.label);
    const uniqueLabels = new Set(labels);
    if (uniqueLabels.size !== labels.length) {
      const duplicates = labels.filter((label: string, index: number) => labels.indexOf(label) !== index);
      throw new Error(`Duplicate labels found: ${duplicates.join(', ')}`);
    }
  }
  next();
});

// Main Form schema
const FormSchema: Schema<IForm> = new Schema<IForm>(
  {
    title: { type: String, required: true },
    description: { type: String },
    fields: { type: [FormFieldSchema], required: true },
    owner: { type: String, required: true }, // Clerk userId
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Form || mongoose.model<IForm>('Form', FormSchema);