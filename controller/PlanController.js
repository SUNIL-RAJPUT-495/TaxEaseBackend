import { Plan } from "../modules/Plan.module.js";

export const createPlan = async (req, res) => {
  try {
    const { 
      serviceCategory, 
      planName, 
      price, 
      description, 
      features, 
      isPopular 
    } = req.body;

    if (!serviceCategory || !planName || !price) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Create Plan
    const plan = new Plan({
      serviceCategory,
      planName,
      price: Number(price.replace(/,/g, '')), 
      description,
      features,
      isPopular
    });

    const savedPlan = await plan.save();
   res.status(201).json({
        message: "Plan created successfully",
        success: true,  
        data: savedPlan
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getPlans = async (req, res) => {
  try {
    const { category } = req.query; 

    let filter = { isActive: true };

    if (category) {
      filter.serviceCategory = { $regex: category, $options: "i" }; 
    }

    const plans = await Plan.find(filter);

    if (!plans || plans.length === 0) {
      return res.status(404).json({
        message: "No plans found",
        success: false
      });
    }

    return res.status(200).json({
      message: "Plans fetched successfully",
      success: true,
      data: plans
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false
    });
  }
};
