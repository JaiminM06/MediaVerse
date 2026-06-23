import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const videoSchema =new Schema(
    {
        videoFile:{
            type:String, //cloudinary url
            required:true,

        },
        thumbnail:{
            type:String, //cloudinary url
            required:true,
        },
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        duration:{
            type:Number, //cloudinary url
            required:true,
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref:"User"
        },
        tags: {
            type: [String],
            default: []
        },
        processingStatus: {
            type: String,
            enum: ['uploading', 'processing', 'ready', 'failed'],
            default: 'uploading'
        },
        rawFileKey: { type: String, default: null },
        hlsManifestUrl: { type: String, default: null },
        variants: [{ resolution: String, bitrate: Number, url: String, size: Number }],
        metadata: {
            codec: { type: String, default: null },
            fps: { type: Number, default: null },
            originalResolution: { type: String, default: null },
            fileSize: { type: Number, default: null }
        },
        thumbnails: { type: [String], default: [] },
        processingError: { type: String, default: null }
    },{
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)
export const Video= mongoose.model("Video",videoSchema)