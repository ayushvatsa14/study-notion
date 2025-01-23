const User=require('../models/User');
const Course=require('../models/Course');
const Category=require('../models/Category');
const {uploadToCloudinary}=require('../utils/mediaUploader');
const {secondsIntoDuraion}=require('../utils/intoDuration');
require('dotenv').config();

exports.createCourse=async(req, res) => {
    try{
        const {courseName, courseDescription, 
            whatYouWillLearn, price, 
            tag: _tag, category, 
            status, instructions: _instructions}=req.body;

        const thumbnail=req.files.thumbnailImage;

        const tag = JSON.parse(_tag);
        const instructions = JSON.parse(_instructions);

        if(!courseName || !courseDescription || 
        !whatYouWillLearn || !price || 
        !tag.length || !thumbnail ||
        !category || !instructions.length){
            return res.status(400).json({
                success: false,
                message: "All Fields are Mandatory"
            });
        }

        if(!status || status===undefined){
            status="Draft";
        }

        const instructorId=req.user.id;

        const instructorDetails=await User.findOne({instructorId, accountType: "Instructor"});
      
        if (!instructorDetails){
            return res.status(404).json({
              success: false,
              message: "Instructor Details Not Found"
            });
        }

        const categoryDetails=await findById(category);

        if(!categoryDetails){
            return res.status(404).json({
                success: false,
                message: "Category Details Not Found"
            });
        }

        const uploadThumbnail=await uploadToCloudinary(thumbnail, process.env.FOLDER_NAME);

        const newCourse=await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag,
            category: categoryDetails._id,
            thumbnail: uploadThumbnail.secure_url,
            status: status,
            instructions
        });

        const userDeatils=await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {$push: {
                courses: newCourse._id
            }},
            {new: true}
        );

        const categoryDetails2=await Category.findByIdAndUpdate(
            {_id: category},
            {
                $push: {
                    courses: newCourse._id
                }
            },
            {new: true}
        );


        res.status(200).json({
            success: true,
            data: newCourse,
            message: "Course Created Successfully"
        })
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: error.message
        });
    }
}

exports.getAllCourses=async(req, res) => {
    try {
        const allCourses=await Course.find(
            {status: "Published"},
            {
              courseName: true,
              price: true,
              thumbnail: true,
              instructor: true,
              ratingAndReviews: true,
              studentsEnrolled: true
            }
        )
        .populate("instructor")
        .exec();
    
        res.status(200).json({
            success: true,
            data: allCourses
        })
    }
    catch(error){
        console.log(error)
        return res.status(404).json({
          success: false,
          message: `Can't Fetch Course Data`,
          error: error.message
        });
    }
}

exports.getCourseDetails=async(req, res) => {
    try{
        const {courseId}=req.body;

        const courseDetails=await Course.findOne({_id: courseId})
        .populate({
            path: "instructor",
            populate: {
                path: "additionalDetails",
            }
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
                select: "-videoUrl"
           }
        })
        .exec();

        if(!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`
            })
        }

        let totalTimeDuration=0;

        courseDetails.courseContent.forEach((content) => {
            content.subSection.dorEach((subSection) => {
                const durationInSeconds=parseInt(subSection.timeDuration);
                totalTimeDuration += durationInSeconds;
            })
        });

        const courseDuration=secondsIntoDuraion(totalTimeDuration);

        res.status(200).json({
            success: true,
            data: {
              courseDetails,
              courseDuration
            }
        })
    }
    catch(error){
        return res.status(500).json({
            success: true,
            message: 'Failed to get course details'
        })
    }
}

exports.editCourse=async(req, res) => {
    try{
        const {courseId}=req.body;
        const updates=req.body;

        const course=await Course.findById(courseId);

        if(!course){
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if(req.files){
            const thumbnail=req.files.thumbnailImage;
            const thumbnailImage=await uploadToCloudinary(thumbnail, process.env.FOLDER_NAME);
            course.thumbnail=thumbnailImage.secure_url;
        }

        for(const key in updates){
            if(updates.hasOwnProperty(key)){
                if(key==="tag" || key==="instructions"){
                    course[key]=json.parse(updates[key]);
                }
                else{
                    course[key]=updates[key];
                }
            }
        }

        await course.save();

        const courseDetails=await Course.findOne({_id: courseId})
        .populate({
            path: "instructor",
            populate: {
                path: "additionalDetails",
            }
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
                select: "-videoUrl"
           }
        })
        .exec();

        res.status(200).json({
            success: true,
            message: 'Course details updated successfully',
            data: courseDetails
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update course details'
        });
    }
}

exports.instructorCourses=async(req, res) => {
    try{
        const instructorId=req.user.id;

        const instructorCourses=await Course.find({instructor: instructorId}).sort({createdAt: -1});

        res.status(200).json({
            success: true,
            message: 'Course details fetched successfully',
            data: instructorCourses
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch instructor courses'
        });
    }
}

exports.getFullCourseDetails=async(req, res) => {
    try {
        const { courseId }=req.body;
        const userId=req.user.id;

        const courseDetails=await Course.findOne({_id: courseId})
        .populate({
            path: "instructor",
            populate: {
                path: "additionalDetails"
            }
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection"
            }
        })
        .exec();
        
        let courseProgressCount=await CourseProgress.findOne({
            courseID: courseId,
            userId: userId
        });
        
        console.log("courseProgressCount : ", courseProgressCount);
        
        if(!courseDetails){
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`
            });
        }
        
        let totalDurationInSeconds=0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds=parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDurationInSeconds;
            })
        });
        
        const totalDuration=secondsIntoDuraion(totalDurationInSeconds);
        
        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                ? courseProgressCount?.completedVideos
                : []
            }
        });
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}