import Response from '../models/response.model';
import Form, { FormField } from '../models/form.model';

interface ResponseField {
  label: string;
  value: string | number | boolean | string[];
}

interface SubmitResponseInput {
  responses: ResponseField[];
}

// Submit response for a form
export async function submitResponse(
  formId: string,
  input: SubmitResponseInput,
  submitterId?: string // Optional Clerk userId
): Promise<{ success: boolean; responseId?: string; error?: string }> {
  if (!formId) {
    return { success: false, error: 'Form ID is required' };
  }
  if (!input.responses || !Array.isArray(input.responses)) {
    return { success: false, error: 'Responses must be an array' };
  }

  try {
    const form = await Form.findById(formId);
    if (!form) {
      return { success: false, error: 'Form not found' };
    }

    // Validate responses against form fields
    const formFields = form.fields;
    for (const response of input.responses) {
      const field = formFields.find((f: FormField) => f.label === response.label);
      if (!field) {
        return { success: false, error: `Invalid field: ${response.label}` };
      }
      // Add type checking if needed
    }

    const response = new Response({
      formId,
      submitterId, // Set if provided, undefined otherwise
      responses: input.responses,
    });
    await response.save();
    return { success: true, responseId: response._id.toString() };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save response' };
  }
}

// Get all responses for a form (owner-only)
export async function getFormResponses(
  formId: string,
  userId: string
): Promise<{ success: boolean; responses?: any[]; error?: string }> {
  if (!formId) {
    return { success: false, error: 'Form ID is required' };
  }

  try {
    const form = await Form.findOne({ _id: formId, owner: userId });
    if (!form) {
      return { success: false, error: 'Form not found or unauthorized' };
    }

    const responses = await Response.find({ formId }).select('submitterId responses createdAt');
    return {
      success: true,
      responses: responses.map(res => ({
        responseId: res._id.toString(),
        submitterId: res.submitterId, // Include submitterId
        responses: res.responses,
        createdAt: res.createdAt,
      })),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch responses' };
  }
}