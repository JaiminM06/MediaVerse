import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        hashtags: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
);

// Pre-save hook to extract hashtags from tweet content
tweetSchema.pre("save", function(next) {
    if (this.isModified("content") && this.content) {
        const tags = this.content.match(/#\w+/g) || [];
        this.hashtags = tags.map(tag => tag.substring(1).toLowerCase());
    }
    next();
});

export const Tweet = mongoose.model("Tweet", tweetSchema);