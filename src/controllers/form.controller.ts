import { v4 as uuidv4 } from "uuid";
import Form from "../models/form.model";
import { clearSession } from "../services/redisClient";
import { amendFormSchema } from "../services/aiService";

interface FormField {
  label: string;
  type: "text" | "number" | "email" | "date" | "select" | "checkbox" | "file";
  required: boolean;
  options?: string[];
}

interface SaveFormInput {
  title?: string;
  description?: string;
  schema?: FormField[];
  sessionId?: string;
}

interface UpdateFormInput {
  title?: string;
  description?: string;
  schema?: { label: string }[];
}

// Save/publish form
export async function saveForm(
  input: SaveFormInput,
  userId: string,
  sessionId?: string
): Promise<{ success: boolean; formId?: string; form?: any; error?: string }> {
  const { title, description, schema } = input;

  // Validate input
  if (!title || typeof title !== "string" || title.trim() === "") {
    return { success: false, error: "Title must be a non-empty string" };
  }
  if (!schema || !Array.isArray(schema)) {
    return { success: false, error: "Schema must be an array" };
  }
  if (description && typeof description !== "string") {
    return { success: false, error: "Description must be a string" };
  }

  // Validate schema fields
  for (const [index, field] of schema.entries()) {
    if (!field.label || !field.type || typeof field.required !== "boolean") {
      return {
        success: false,
        error: `Invalid field at index ${index}: missing label, type, or required`,
      };
    }
    if (
      ![
        "text",
        "number",
        "email",
        "date",
        "select",
        "checkbox",
        "file",
      ].includes(field.type)
    ) {
      return { success: false, error: `Invalid field type at index ${index}` };
    }
    if (
      field.type === "select" &&
      (!Array.isArray(field.options) || !field.options.length)
    ) {
      return {
        success: false,
        error: `Select field at index ${index} requires non-empty options array`,
      };
    }
    if (field.type !== "select" && field.options) {
      delete field.options;
    }
  }

  try {
    const form = new Form({
      title,
      description,
      fields: schema,
      owner: userId,
    });
    await form.save();

    // Clear Redis session
    if (sessionId) {
      await clearSession(sessionId);
    }

    return {
      success: true,
      formId: form._id.toString(),
      form: {
        title: form.title,
        description: form.description,
        schema: form.fields,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save form",
    };
  }
}

// Start amend form process
export async function getFormSchemaForAmend(
  formId: string,
  userId: string
): Promise<{
  success: boolean;
  sessionId?: string;
  form?: any;
  error?: string;
}> {
  if (!formId) {
    return { success: false, error: "Form ID is required" };
  }

  try {
    const form = await Form.findOne({ _id: formId, owner: userId });
    if (!form) {
      return { success: false, error: "Form not found or unauthorized" };
    }

    // Delegate schema amendment to aiService
    const { sessionId, schema } = await amendFormSchema(form.fields);

    return {
      success: true,
      sessionId,
      form: { title: form.title, description: form.description, schema },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to start amend process",
    };
  }
}

// Update form manually (title, description, labels)
export async function updateForm(
  formId: string,
  userId: string,
  input: UpdateFormInput
): Promise<{ success: boolean; form?: any; error?: string }> {
  if (!formId) return { success: false, error: "Form ID is required" };
  const { title, description, schema } = input;

  try {
    const form = await Form.findOne({ _id: formId, owner: userId });
    if (!form)
      return { success: false, error: "Form not found or unauthorized" };

    // Update title if provided
    if (title && typeof title === "string" && title.trim() !== "") {
      form.title = title;
    }

    // Update description if provided
    if (description && typeof description === "string") {
      form.description = description;
    }

    // Update labels if schema is provided
    if (schema && Array.isArray(schema)) {
      const newLabels = schema.map((field) => field.label);
      form.fields = form.fields.map((field: FormField, index: number) => ({
        ...field,
        label: newLabels[index] || field.label,
      }));
    }

    await form.save();
    return {
      success: true,
      form: {
        title: form.title,
        description: form.description,
        schema: form.fields,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update form",
    };
  }
}

// Delete form
export async function deleteForm(
  formId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!formId) return { success: false, error: "Form ID is required" };
  try {
    const result = await Form.deleteOne({ _id: formId, owner: userId });
    if (result.deletedCount === 0)
      return { success: false, error: "Form not found or unauthorized" };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete form",
    };
  }
}

// Get public form for response
export async function getPublicForm(
  formId: string
): Promise<{ success: boolean; form?: any; error?: string }> {
  if (!formId) {
    return { success: false, error: "Form ID is required" };
  }

  try {
    const form = await Form.findById(formId);
    if (!form) {
      return { success: false, error: "Form not found" };
    }

    return {
      success: true,
      form: {
        title: form.title,
        description: form.description,
        schema: form.fields,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch public form",
    };
  }
}

// Get all forms for the authenticated user
export async function getUserForms(
  userId: string
): Promise<{ success: boolean; forms?: any[]; error?: string }> {
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  try {
    const forms = await Form.find({ owner: userId }).select(
      "title description fields createdAt updatedAt"
    );
    return {
      success: true,
      forms: forms.map((form) => ({
        formId: form._id.toString(),
        title: form.title,
        description: form.description,
        schema: form.fields,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
      })),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch user forms",
    };
  }
}
