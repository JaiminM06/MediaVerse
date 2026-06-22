import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();


const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
});


const test = async()=>{

    const data = await s3.send(
        new ListBucketsCommand({})
    );

    console.log(data.Buckets);
};


test();