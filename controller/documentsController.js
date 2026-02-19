import { DocRequirement } from "../modules/documentRequirement.model.js";

export const saveDocRequirements = async (req, res) => {
    try {
        const { serviceId, planId, documents } = req.body;

        if (!serviceId || !planId || !documents || documents.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Service, Plan and at least one document are required."
            });
        }

        const updatedReq = await DocRequirement.findOneAndUpdate(
            { serviceId, planId },
            { documents },         
            { new: true, upsert: true } 
        );

        return res.status(200).json({
            success: true,
            message: "Document requirements saved successfully!",
            data: updatedReq
        });

    } catch (error) {
        console.error("Error saving doc requirements:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


export const getDocRequirements = async (req, res) => {
    try {
        const { serviceId, planId } = req.query;

        if (!serviceId || !planId) {
            return res.status(400).json({
                success: false,
                message: "Service ID and Plan ID are required to fetch requirements."
            });
        }

        const requirement = await DocRequirement.findOne({ serviceId, planId });

        if (requirement) {
            return res.status(200).json({
                success: true,
                message: "Requirements fetched successfully",
                data: requirement.documents
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "No requirements found for this plan",
                data: [] 
            });
        }

    } catch (error) {
        console.error("Error fetching doc requirements:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};