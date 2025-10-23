import Form from "../models/form.model";
import Response from "../models/response.model";
import { Request, Response as ExpressResponse } from "express";

export async function getDashboardData(userId: string): Promise<{
  success: boolean;
  data?: {
    totalForms: number;
    totalResponses: number;
    recentForms: any[];
    recentResponses: any[];
    formsByMonth: { month: string; count: number }[];
    responsesByMonth: { month: string; count: number }[];
    averageFieldsPerForm: number;
    mostActiveForm: {
      formId: string;
      title: string;
      responseCount: number;
    } | null;
    totalFields: number;
  };
  error?: string;
}> {
  try {
    // Get total forms count
    const totalForms = await Form.countDocuments({ owner: userId });

    // Get all forms for the user
    const userForms = await Form.find({ owner: userId }).select(
      "_id title createdAt fields"
    );
    const formIds = userForms.map((form) => form._id.toString());

    // Get total responses across all user forms
    const totalResponses = await Response.countDocuments({
      formId: { $in: formIds },
    });

    // Get recent forms (last 5)
    const recentForms = await Form.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id title description createdAt fields")
      .lean();

    // Get recent responses (last 10)
    const recentResponses = await Response.find({ formId: { $in: formIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("formId", "title")
      .lean();

    // Get forms created by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const formsByMonth = await Form.aggregate([
      { $match: { owner: userId, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const formattedFormsByMonth = formsByMonth.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      count: item.count,
    }));

    // Get responses by month (last 6 months)
    const responsesByMonth = await Response.aggregate([
      {
        $match: { formId: { $in: formIds }, createdAt: { $gte: sixMonthsAgo } },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const formattedResponsesByMonth = responsesByMonth.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      count: item.count,
    }));

    // Calculate average fields per form
    const totalFields = userForms.reduce(
      (sum, form) => sum + form.fields.length,
      0
    );
    const averageFieldsPerForm = totalForms > 0 ? totalFields / totalForms : 0;

    // Find most active form (form with most responses)
    const formResponseCounts = await Response.aggregate([
      { $match: { formId: { $in: formIds } } },
      {
        $group: {
          _id: "$formId",
          responseCount: { $sum: 1 },
        },
      },
      { $sort: { responseCount: -1 } },
      { $limit: 1 },
    ]);

    let mostActiveForm = null;
    if (formResponseCounts.length > 0) {
      const formId = formResponseCounts[0]._id;
      const form = userForms.find((f) => f._id.toString() === formId);
      if (form) {
        mostActiveForm = {
          formId: form._id.toString(),
          title: form.title,
          responseCount: formResponseCounts[0].responseCount,
        };
      }
    }

    return {
      success: true,
      data: {
        totalForms,
        totalResponses,
        recentForms: recentForms.map((form) => ({
          formId: (form._id as any).toString(),
          title: form.title,
          description: form.description,
          createdAt: form.createdAt,
          fieldCount: form.fields.length,
        })),
        recentResponses: recentResponses.map((response) => ({
          responseId: (response._id as any).toString(),
          formTitle: response.formId?.title || "Unknown Form",
          createdAt: response.createdAt,
          responseCount: response.responses.length,
        })),
        formsByMonth: formattedFormsByMonth,
        responsesByMonth: formattedResponsesByMonth,
        averageFieldsPerForm: Math.round(averageFieldsPerForm * 100) / 100,
        mostActiveForm,
        totalFields,
      },
    };
  } catch (error) {
    console.error("Dashboard data error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
