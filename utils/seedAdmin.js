import { User } from "../modules/user.module.js";
import bcrypt from "bcryptjs";

export const seedAdminAccount = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        
  
        const adminExists = await User.findOne({ email: adminEmail });
        
        if (!adminExists) {
            console.log("🚀 Creating Initial Admin Account...");
            
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            
            const admin = new User({
                name: process.env.ADMIN_NAME,
                email: adminEmail,
                password: hashedPassword,
                phone: "9999999222",
                role: "admin" 
            });

            await admin.save();
            console.log("✅ Admin Account Seeded Successfully!");
        }
    } catch (error) {
        console.error("❌ Admin Seeding Failed:", error);
    }
};