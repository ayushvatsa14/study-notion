const Category=require("../models/Category");

exports.createCategory=async(req, res) => {
    try{
        const {name, description}=req.body;

        if(!name){
            return res.status(400).json({
                success: false,
                message: "All Fields are Mandatory"
            });
        }

        const categoryDetails=await Category.create({name, description});

        res.status(200).json({
            status: true,
            message: "Category created successfully"
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Failed to create category"
        });
    }
}

exports.getAllCategory=async(req, res) => {
    try{
		const allCategorys = await Category.find({});
		res.status(200).json({
			success: true,
			data: allCategorys
		});
	}
    catch(error){
		return res.status(500).json({
			success: false,
			message: error.message
		});
	}
}