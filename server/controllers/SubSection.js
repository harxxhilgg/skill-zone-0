// Import necessary modules
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config()

// Create a new sub-section for a given section
exports.createSubSection = async (req, res) => {
    try{
        //fetch
        const { sectionId, title, description } = req.body;
        const video = req.files.video;

        //validate Check if all necessary fields are provided
        if (!sectionId || !title || !description || !video) {
        return res
          .status(404)
          .json({ success: false, message: "All Fields are Required" })
        }
        console.log(video);

        // Upload the video file to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);
        console.log(uploadDetails);

        // Create a new sub-section with the necessary information
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

            
        // Update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: SubSectionDetails._id } },
            { new: true },
        ).populate("subSection")

        
        // Return the updated section in the response
        return res.status(200).json({ success: true, data: updatedSection })

    }catch(error){

    // Handle any errors that may occur during the process
    console.error("Error creating new sub-section:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
        
    }
}
