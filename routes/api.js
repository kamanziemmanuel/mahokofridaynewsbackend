const router = require('express').Router();

const {
  Author,
  Comment,
  Story,
  Video,
  Ad,
  Subscriber,
  AuditLog
} = require('../models');

const mongoose = require('mongoose');

const sendNewsletter = require("../services/emailService");

const {
  auth,
  requireRole
} = require('../middleware/auth');

const upload = require('../middleware/upload');
const uploadToCloudinary = require('../middleware/cloudinaryUpload');


// ================= AUTHORS =================


// GET ALL AUTHORS
router.get('/authors', async (req, res) => {
  try {

    const authors = await Author.find()
      .sort({ name: 1 })
      .lean();


    const result = await Promise.all(
      authors.map(async (a) => ({
        ...a,
        id: a._id,
        story_count: await Story.countDocuments({
          author_id: a._id
        })
      }))
    );


    res.json(result);


  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});




// IMPORTANT: iyi route ijya mbere ya /authors/:id
// GET STORIES BY AUTHOR
// UPDATE AUTHOR
// ======================================================
// UPDATE AUTHOR
// ======================================================
router.put(
  '/authors/:id',
  auth,
  requireRole('Admin', 'Editor'),
  upload.single('profile_image'),

  async (req, res) => {
    try {
      const { id } = req.params;

      console.log('=================================');
      console.log('UPDATE AUTHOR');
      console.log('Author ID:', id);
      console.log('Body:', req.body);
      console.log('File:', req.file ? req.file.originalname : 'No file');
      console.log('=================================');

      // Check ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid author id',
        });
      }

      // Find author
      const author = await Author.findById(id);

      if (!author) {
        return res.status(404).json({
          success: false,
          error: 'Author not found',
        });
      }

      // ==================================================
      // UPDATE TEXT FIELDS
      // ==================================================

      const fields = [
        'name',
        'bio',
        'email',
        'twitter',
        'portfolio',
        'website',
        'facebook',
        'instagram',
        'linkedin',
        'youtube',
        'phone',
        'location',
        'profession',
        'specialties',
        'awards',
        'experience',
        'portfolio_description',
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          author[field] = req.body[field];
        }
      });

      // ==================================================
      // PROFILE IMAGE
      // ==================================================

      if (req.file) {
        try {
          const result = await uploadToCloudinary(
            req.file.buffer,
            'authors'
          );

          if (!result || !result.secure_url) {
            return res.status(500).json({
              success: false,
              error: 'Cloudinary did not return an image URL',
            });
          }

          author.profile_image = result.secure_url;
        } catch (uploadError) {
          console.error(
            'Cloudinary author image error:',
            uploadError
          );

          return res.status(500).json({
            success: false,
            error: 'Failed to upload profile image',
            details: uploadError.message,
          });
        }
      }

      // ==================================================
      // VALIDATION
      // ==================================================

      if (!author.name || !author.name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Author name is required',
        });
      }

      // ==================================================
      // SAVE
      // ==================================================

      await author.save();

      // ==================================================
      // AUDIT LOG
      // ==================================================

      try {
        await AuditLog.create({
          username: req.user?.username || 'Unknown',
          action: `Updated author: ${author.name}`,
          ip_address:
            req.ip ||
            req.headers['x-forwarded-for'] ||
            '',
        });
      } catch (auditError) {
        console.error(
          'Audit log error:',
          auditError.message
        );
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      res.status(200).json({
        success: true,
        message: 'Author updated successfully',

        author: {
          ...author.toObject(),
          id: author._id,
        },
      });

    } catch (err) {
      console.error('=================================');
      console.error('UPDATE AUTHOR ERROR');
      console.error(err);
      console.error('=================================');

      res.status(500).json({
        success: false,
        error: 'Failed to update author',
        details: err.message,
      });
    }
  }
);


router.get('/authors/:id/stories', async (req, res) => {

  try {


    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

      return res.status(400).json({
        error: "Invalid author id"
      });

    }


    const stories = await Story.find({

      author_id: req.params.id,

      status: "published"

    })
    .populate(
      'author_id',
      'profile_image bio name twitter'
    )
    .sort({
      createdAt:-1
    })
    .lean();



    res.json({

      stories: stories.map(s => ({

        ...s,

        id:s._id,


        author_avatar:
        s.author_id?.profile_image ||
        s.author_image ||
        '',


        author_bio_full:
        s.author_id?.bio ||
        s.author_bio ||
        '',


        author_twitter:
        s.author_id?.twitter ||
        '',


        created_at:
        s.createdAt,


        updated_at:
        s.updatedAt

      }))

    });



  } catch(err) {


    res.status(500).json({

      error:err.message

    });


  }

});




// GET SINGLE AUTHOR

router.get('/authors/:id', async(req,res)=>{

try{


const author =
await Author.findById(req.params.id)
.lean();



if(!author)

return res.status(404).json({

error:"Author not found"

});



res.json({

...author,

id:author._id

});



}catch(err){

res.status(500).json({

error:err.message

});


}

});





// CREATE AUTHOR

router.post(
'/authors',
auth,
requireRole('Admin','Editor'),
upload.single('profile_image'),

async(req,res)=>{


try{


const {
name,
bio,
email,
twitter
}=req.body;



let profile_image='';



if(req.file){

const result =
await uploadToCloudinary(
req.file.buffer,
'authors'
);


profile_image =
result.secure_url;

}




const author =
await Author.create({

name,

bio,

email,

twitter,

profile_image

});




await AuditLog.create({

username:req.user.username,

action:`Created author: ${name}`

});




res.status(201).json({

id:author._id,

message:"Author created"

});



}catch(err){


res.status(500).json({

error:err.message

});


}

});


// ================= COMMENTS =================


// GET COMMENTS BY STORY
router.get('/comments/story/:id', async(req,res)=>{

try{


const comments = await Comment.find({

story_id:req.params.id

})
.sort({
createdAt:-1
})
.lean();



res.json(
comments.map(c=>({

...c,

id:c._id,

created_at:c.createdAt

}))
);



}catch(err){

res.status(500).json({

error:err.message

});

}

});




// GET ALL COMMENTS ADMIN

router.get('/comments',
auth,
async(req,res)=>{

try{


const {

status='pending',

story_id,

page=1,

limit=20

}=req.query;



const query={};



if(status)

query.status=status;



if(story_id)

query.story_id=story_id;



const skip =
(parseInt(page)-1) *
parseInt(limit);



const comments =
await Comment.find(query)

.populate(
'story_id',
'title'
)

.sort({
createdAt:-1
})

.skip(skip)

.limit(parseInt(limit))

.lean();




res.json(

comments.map(c=>({

...c,

id:c._id,

story_title:
c.story_id?.title || '',

created_at:c.createdAt

}))

);



}catch(err){

res.status(500).json({

error:err.message

});

}


});




// CREATE COMMENT

router.post('/comments',
async(req,res)=>{

try{


const {

story_id,

parent_id,

name,

email,

comment

}=req.body;



if(!comment?.trim())

return res.status(400).json({

error:"Comment text required"

});




const newComment =
await Comment.create({

story_id,

parent_id:
parent_id || null,

name:
name?.trim() || "BANYA",

email:
email || "",

comment:
comment.trim(),

status:"pending"

});



res.status(201).json({

id:newComment._id,

message:"Comment submitted"

});



}catch(err){


res.status(500).json({

error:err.message

});


}

});





// ================= VIDEOS =================


router.get('/videos',
async(req,res)=>{

try{


const videos =
await Video.find()

.sort({
createdAt:-1
})

.lean();



res.json(

videos.map(v=>({

...v,

id:v._id,

created_at:v.createdAt

}))

);



}catch(err){

res.status(500).json({

error:err.message

});

}


});





router.post(
'/videos',

auth,

requireRole('Admin','Editor'),

upload.single('thumbnail'),

async(req,res)=>{


try{


const {

title,

youtube_url,

category

}=req.body;



let thumbnail="";



if(req.file){


const result =
await uploadToCloudinary(

req.file.buffer,

'videos'

);


thumbnail=result.secure_url;


}




let embedUrl=youtube_url;



if(youtube_url){


const match =

youtube_url.match(/[?&]v=([^?&]+)/)

||

youtube_url.match(/youtu\.be\/([^?&]+)/);



if(match)

embedUrl =
`https://www.youtube.com/embed/${match[1]}`;

}




const video =
await Video.create({

title,

youtube_url:embedUrl,

thumbnail,

category:category || "General"

});




await AuditLog.create({

username:req.user.username,

action:`Added video: ${title}`

});




res.status(201).json({

id:video._id

});



}catch(err){

res.status(500).json({

error:err.message

});

}


});


// ======================================================
// 1. UPDATE VIDEO
// ======================================================

router.put(
  '/videos/:id',
  auth,
  requireRole('Admin', 'Editor'),
  upload.single('thumbnail'),

  async (req, res) => {
    try {

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid video id'
        });
      }

      const video = await Video.findById(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      const {
        title,
        youtube_url,
        category
      } = req.body;

      if (title !== undefined) {
        video.title = title;
      }

      if (category !== undefined) {
        video.category = category;
      }

      if (
        youtube_url !== undefined &&
        youtube_url.trim()
      ) {

        let embedUrl =
          youtube_url.trim();

        const match =
          youtube_url.match(
            /[?&]v=([^?&]+)/
          ) ||
          youtube_url.match(
            /youtu\.be\/([^?&]+)/
          );

        if (match) {
          embedUrl =
            `https://www.youtube.com/embed/${match[1]}`;
        }

        video.youtube_url = embedUrl;
      }

      if (req.file) {

        const result =
          await uploadToCloudinary(
            req.file.buffer,
            'videos'
          );

        if (
          !result ||
          !result.secure_url
        ) {
          return res.status(500).json({
            success: false,
            error:
              'Cloudinary did not return an image URL'
          });
        }

        video.thumbnail =
          result.secure_url;
      }

      await video.save();

      try {

        await AuditLog.create({
          username:
            req.user?.username ||
            'Unknown',

          action:
            `Updated video: ${video.title}`,

          ip_address:
            req.ip ||
            req.headers['x-forwarded-for'] ||
            ''
        });

      } catch (auditError) {

        console.error(
          'Video update audit log error:',
          auditError.message
        );

      }

      res.status(200).json({
        success: true,
        message:
          'Video updated successfully',

        video: {
          ...video.toObject(),
          id: video._id
        }
      });

    } catch (err) {

      console.error(
        'UPDATE VIDEO ERROR:',
        err
      );

      res.status(500).json({
        success: false,
        error:
          'Failed to update video',
        details: err.message
      });

    }
  }
);


// ======================================================
// 2. DELETE VIDEO
// ======================================================

router.delete(
  '/videos/:id',
  auth,
  requireRole('Admin'),

  async (req, res) => {

    try {

      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid video id'
        });
      }

      const video =
        await Video.findById(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }

      const videoTitle =
        video.title;

      await Video.findByIdAndDelete(id);

      try {

        await AuditLog.create({
          username:
            req.user?.username ||
            'Unknown',

          action:
            `Deleted video: ${videoTitle}`,

          ip_address:
            req.ip ||
            req.headers['x-forwarded-for'] ||
            ''
        });

      } catch (auditError) {

        console.error(
          'Video delete audit log error:',
          auditError.message
        );

      }

      res.json({
        success: true,
        message:
          'Video deleted successfully'
      });

    } catch (err) {

      console.error(
        'DELETE VIDEO ERROR:',
        err
      );

      res.status(500).json({
        success: false,
        error:
          'Failed to delete video',
        details: err.message
      });

    }

  }
);





// ================= ADS =================


router.get('/ads',
async(req,res)=>{

try{


const query={

active:true

};



if(req.query.position)

query.position=req.query.position;



const ads =
await Ad.find(query)

.sort({
createdAt:-1
})

.lean();




res.json(

ads.map(a=>({

...a,

id:a._id,

created_at:a.createdAt

}))

);



}catch(err){

res.status(500).json({

error:err.message

});

}


});





router.get('/ads/all',
auth,
async(req,res)=>{

try{


const ads =
await Ad.find()

.sort({
createdAt:-1
})

.lean();



res.json(

ads.map(a=>({

...a,

id:a._id,

created_at:a.createdAt

}))

);



}catch(err){

res.status(500).json({

error:err.message

});

}


});






router.post(
'/ads',

auth,

requireRole('Admin'),

upload.single('file'),

async(req,res)=>{


try{


const {

type,

link,

position,

text

}=req.body;



let file="";

let cloudinary_public_id="";



if(req.file){


const result =
await uploadToCloudinary(

req.file.buffer,

'ads'

);



file=result.secure_url;

cloudinary_public_id=result.public_id;


}




const ad =
await Ad.create({

type:type || "image",

file,

cloudinary_public_id,

link:link || "#",

position:position || "sidebar",

text:text || "",

active:true

});




await AuditLog.create({

username:req.user.username,

action:"Created advertisement"

});




res.status(201).json({

id:ad._id,

message:"Ad created"

});



}catch(err){


res.status(500).json({

error:err.message

});


}

});


// ======================================================
// 3. UPDATE AD
// ======================================================

router.put(
  '/ads/:id',
  auth,
  requireRole('Admin'),
  upload.single('file'),

  async (req, res) => {

    try {

      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ad id'
        });
      }

      const ad =
        await Ad.findById(id);

      if (!ad) {
        return res.status(404).json({
          success: false,
          error:
            'Advertisement not found'
        });
      }

      const {
        type,
        link,
        position,
        text,
        active
      } = req.body;

      if (type !== undefined) {
        ad.type = type;
      }

      if (link !== undefined) {
        ad.link = link;
      }

      if (position !== undefined) {
        ad.position = position;
      }

      if (text !== undefined) {
        ad.text = text;
      }

      if (active !== undefined) {
        ad.active =
          active === true ||
          active === 'true';
      }

      if (req.file) {

        const result =
          await uploadToCloudinary(
            req.file.buffer,
            'ads'
          );

        if (
          !result ||
          !result.secure_url
        ) {
          return res.status(500).json({
            success: false,
            error:
              'Cloudinary did not return an ad URL'
          });
        }

        ad.file =
          result.secure_url;

        ad.cloudinary_public_id =
          result.public_id || '';
      }

      await ad.save();

      try {

        await AuditLog.create({
          username:
            req.user?.username ||
            'Unknown',

          action:
            `Updated advertisement: ${ad._id}`,

          ip_address:
            req.ip ||
            req.headers['x-forwarded-for'] ||
            ''
        });

      } catch (auditError) {

        console.error(
          'Ad update audit log error:',
          auditError.message
        );

      }

      res.status(200).json({
        success: true,
        message:
          'Advertisement updated successfully',

        ad: {
          ...ad.toObject(),
          id: ad._id
        }
      });

    } catch (err) {

      console.error(
        'UPDATE AD ERROR:',
        err
      );

      res.status(500).json({
        success: false,
        error:
          'Failed to update advertisement',
        details: err.message
      });

    }

  }
);


// ======================================================
// 4. DELETE AD
// ======================================================

router.delete(
  '/ads/:id',
  auth,
  requireRole('Admin'),

  async (req, res) => {

    try {

      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ad id'
        });
      }

      const ad =
        await Ad.findById(id);

      if (!ad) {
        return res.status(404).json({
          success: false,
          error:
            'Advertisement not found'
        });
      }

      await Ad.findByIdAndDelete(id);

      try {

        await AuditLog.create({
          username:
            req.user?.username ||
            'Unknown',

          action:
            `Deleted advertisement: ${ad._id}`,

          ip_address:
            req.ip ||
            req.headers['x-forwarded-for'] ||
            ''
        });

      } catch (auditError) {

        console.error(
          'Ad delete audit log error:',
          auditError.message
        );

      }

      res.json({
        success: true,
        message:
          'Advertisement deleted successfully'
      });

    } catch (err) {

      console.error(
        'DELETE AD ERROR:',
        err
      );

      res.status(500).json({
        success: false,
        error:
          'Failed to delete advertisement',
        details: err.message
      });

    }

  }
);



// ================= SUBSCRIBERS =================


router.post('/subscribe',
async(req,res)=>{

try{


const {

email,

name

}=req.body;



if(!email)

return res.status(400).json({

error:"Email required"

});



await Subscriber.create({

email:email.toLowerCase().trim(),

name:name || ""

});



res.json({

status:"success",

message:"Subscribed successfully"

});



}catch(err){


if(err.code===11000)

return res.json({

status:"info",

message:"Already subscribed"

});



res.status(500).json({

error:err.message

});


}

});


// ======================================================
// 5. GET ALL SUBSCRIBERS
// ======================================================

router.get(
  '/subscribers',
  auth,
  requireRole('Admin', 'Editor'),

  async (req, res) => {

    try {

      const subscribers =
        await Subscriber.find()
          .sort({
            createdAt: -1
          })
          .lean();

      res.json({

        success: true,

        total:
          subscribers.length,

        subscribers:
          subscribers.map(
            (subscriber) => ({
              ...subscriber,

              id:
                subscriber._id,

              created_at:
                subscriber.createdAt
            })
          )

      });

    } catch (err) {

      console.error(
        'GET SUBSCRIBERS ERROR:',
        err
      );

      res.status(500).json({

        success: false,

        error:
          'Failed to fetch subscribers',

        details:
          err.message

      });

    }

  }
);


// ======================================================
// 6. DELETE SUBSCRIBER
// ======================================================

router.delete(
  '/subscribers/:id',
  auth,
  requireRole('Admin'),

  async (req, res) => {

    try {

      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(id)
      ) {

        return res.status(400).json({

          success: false,

          error:
            'Invalid subscriber id'

        });

      }

      const subscriber =
        await Subscriber.findById(id);

      if (!subscriber) {

        return res.status(404).json({

          success: false,

          error:
            'Subscriber not found'

        });

      }

      const email =
        subscriber.email;

      await Subscriber.findByIdAndDelete(
        id
      );

      try {

        await AuditLog.create({

          username:
            req.user?.username ||
            'Unknown',

          action:
            `Deleted subscriber: ${email}`,

          ip_address:
            req.ip ||
            req.headers['x-forwarded-for'] ||
            ''

        });

      } catch (auditError) {

        console.error(
          'Subscriber delete audit log error:',
          auditError.message
        );

      }

      res.json({

        success: true,

        message:
          'Subscriber deleted successfully'

      });

    } catch (err) {

      console.error(
        'DELETE SUBSCRIBER ERROR:',
        err
      );

      res.status(500).json({

        success: false,

        error:
          'Failed to delete subscriber',

        details:
          err.message

      });

    }

  }
);







// ================= ANALYTICS =================


router.get('/analytics/overview',
auth,
async(req,res)=>{

try{


const [

stories,

views,

comments,

subscribers,

trending

]=await Promise.all([


Story.countDocuments({

status:"published"

}),


Story.aggregate([

{

$group:{

_id:null,

total:{

$sum:"$views"

}

}

}

]),



Comment.countDocuments({

status:"pending"

}),



Subscriber.countDocuments(),



Story.find({

status:"published"

})

.select(
'title category views'
)

.sort({

views:-1

})

.limit(5)

.lean()


]);




res.json({

stories,

views:views[0]?.total || 0,

pendingComments:comments,

subscribers,

trending:trending.map(s=>({

...s,

id:s._id

}))


});



}catch(err){

res.status(500).json({

error:err.message

});

}

});





// ================= BREAKING =================


router.get('/breaking',
async(req,res)=>{


try{


const stories =
await Story.find({

status:"published"

})

.select('title')

.sort({

createdAt:-1

})

.limit(8)

.lean();




res.json(

stories.map(s=>({

title:s.title

}))

);



}catch(err){

res.status(500).json({

error:err.message

});

}


});


// ================= NEWSLETTER =================

router.post("/newsletter/send", async(req,res)=>{

try{

const {subject,message}=req.body;


console.log("SUBJECT:", subject);
console.log("MESSAGE:", message);


const subscribers = await Subscriber.find({
active:true
});


console.log("SUBSCRIBERS:", subscribers);


const emails = subscribers.map(
subscriber => subscriber.email
);


console.log("EMAILS:", emails);



await sendNewsletter({
emails,
subject,
html:message
});


res.json({

message:"Newsletter sent successfully",

sentTo:emails.length

});


}catch(error){

console.log(error);

res.status(500).json({
error:error.message
});

}

});

module.exports = router;
