import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt';
const userSchema = new Schema(
    {
    username:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type: String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinary url
        required:true,

    },
    coverImage:{
        type:String, //cloudinary url


    },
    password:{
        type:String,
    },
    refreshToken:{
        type:String,
    },
    searchHistory: {
        type: [{
            query:      { type: String, required: true },
            searchedAt: { type: Date, default: Date.now }
        }],
        default: [],
        validate: {
            validator: function(arr) { return arr.length <= 10; },
            message: 'Search history cannot exceed 10 entries'
        }
    }


    },
    {
        timestamps:true
    }
)

//do not use () =>{} in pre and some other hookes because this donot have reference so we can not access the usermode so instead of it use function () {}
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect= async function(password){
     return await bcrypt.compare(password,this.password)
}

// jwt is a bearer token

userSchema.methods.generateAccessToken = function(){
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET environment variable is not set');
    }
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken= function(){
    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error('REFRESH_TOKEN_SECRET environment variable is not set');
    }
    return jwt.sign(
        {
            _id:this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema)