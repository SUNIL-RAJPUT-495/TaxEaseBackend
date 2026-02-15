import { Plan } from "../modules/Plan.module.js";
import { Order } from "../modules/Order.module.js";

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


export const getAllServices = async (req, res) => {
  try {
    const [plans, allPaidOrders] = await Promise.all([
      Plan.find().lean(),
      Order.find({ status: "paid" }).lean()
    ]);

    const plansWithCount = plans.map(plan => {
      const userCount = allPaidOrders.filter(order => {
        
        return String(order.planName).trim().toLowerCase() === String(plan.planName).trim().toLowerCase();
      }).length;

      return {
        ...plan,
        totalUsers: userCount
      };
    });

    res.status(200).json({
      success: true,
      message: "Fetched using Manual Mapping",
      data: plansWithCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};


export const editPlan = async (req, res) => {
  try {
    const { id, planName, price, description, features, isPopular, isActive, serviceCategory } = req.body;

    if (!id) {
        return res.status(400).json({
            message: "Plan ID is required for update",
            error: true,
            success: false
        });
    }


    const updatedPlan = await Plan.findByIdAndUpdate(
      id, 
      {
        planName,
        price,
        description,
        features,
        isPopular,
        isActive,
        serviceCategory
      },
      { new: true } 
    );

    if (!updatedPlan) {
      return res.status(404).json({
        message: "Plan not found",
        error: true,
        success: false
      });
    }

    res.status(200).json({
      message: "Plan updated successfully!",
      data: updatedPlan,
      error: false,
      success: true
    });

  } catch (error) {
    res.status(500).json({ 
        message: error.message || error, 
        error: true,
        success: false 
    });
  }
};


export const deletePlan = async (req, res) => {
  try {
    const { id } = req.body; 

    if (!id) {
      return res.status(400).json({
        message: "Plan ID is required for deletion",
        error: true,
        success: false
      });
    }

    const deletedPlan = await Plan.findByIdAndDelete(id);

    if (!deletedPlan) {
      return res.status(404).json({
        message: "Plan not found",
        error: true,
        success: false
      });
    }

    res.status(200).json({
      message: `Plan "${deletedPlan.planName}" deleted successfully!`,
      error: false,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
};


export const getPlanDetails = async (req, res) => {
    try {
        const { planId } = req.query;

        if (!planId) {
            return res.status(400).json({
                success: false,
                message: "Plan ID is required"
            });
        }

        const plan = await Plan.findById(planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: plan
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};