const Course = require("../models/Course")
const Category = require("../models/Category")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const CourseProgress = require("../models/CourseProgress")
const { convertSecondsToDuration } = require("../utils/secToDuration")


exports.createCourseHanlder=async(req,res)=>{
    try{
        // Get user ID from request object
        const userId = req.user.id

        // Get all required fields from request body
        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag,
            
        } = req.body
        // Get thumbnail image from request files
        const thumbnail = req.files.thumbnailImage;

        //validation
        if (!courseName ||!courseDescription ||!whatYouWillLearn ||!price ||!tag ||!thumbnail) {
            return res.status(400).json({
              success: false,
              message: "All Fields are Mandatory",
            })
        }
        // Check if the user is an instructor
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor",
        })
  
        if (!instructorDetails) {
        return res.status(404).json({
          success: false,
          message: "Instructor Details Not Found",
        })
        }
        
        //check tag validation
        const tagDetails=await User.findById(tag);
        if(!tagDetails){
            return res.status(404).json({
                success: false,
                message: "tag  Details Not Found",
            })
        }


        // Upload the Thumbnail to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME)
        console.log(thumbnailImage)


        // Create a new course with the given details
        const newCourse = await Course.create({
        courseName,
        courseDescription,
        instructor: instructorDetails._id,
        whatYouWillLearn: whatYouWillLearn,
        price,
        tag:tagDetails._id,
        thumbnail: thumbnailImage.secure_url,
        });

        //Add the newlly created course into the instructors course array
        await User.findByIdAndUpdate({id:instructorDetails._id},
        {   $push: {
                courses: newCourse._id,
            }
        },{new:true});

        
        // Return the new course and a success message
        res.status(200).json({
          success: true,
          data: newCourse,
          message: "Course Created Successfully",
        })
    }
    catch(err){
        console.error(err)
        res.status(500).json({
          success: false,
          message: "Failed to create course",
          error: err.message,
        })
    }
}


// Get Course List
exports.getAllCourses = async (req, res) => {
    try {
      const allCourses = await Course.find(
        {},
        {courseName: true,price: true,thumbnail: true,instructor: true,ratingAndReviews: true,studentsEnrolled: true,}
      )
        .populate("instructor")
        .exec()
  
      return res.status(200).json({
        success: true,
        data: allCourses,
      })
    } catch (error) {
      console.log(error)
      return res.status(404).json({
        success: false,
        message: `Can't Fetch Course Data`,
        error: error.message,
      })
    }
}

//get all details 
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl",
        },
      })
      .exec()

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }
    return res.status(200).json({
      success: true,
      message: "course detail found successfuly",
      data: {
        courseDetails,
      },
    })
  
  }catch(error){
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}