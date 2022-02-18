const multer = require('multer')

module.exports = (imageFile)=>{
    // destinasi file upload
    const storage = multer.diskStorage({
        destination : function(req, file, cb){
            cb(null, 'uploads')
        },
        filename: function(req, file, cb){
            cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, ''))
        }
    })

    const fileFilter = function (req, file, cb){
        if(file.fieldname === imageFile){
            if(!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)){
                req.fileValidationError = {
                    message: "Only image files are allowed"
                };
                return cb(new Error("Only image files are allowed"), false)
            }
        }
        cb(null, true)
    }
    const sizeInMB = 10
    const maxSize = sizeInMB * 1024 * 1000

    //generate upload
    const upload = multer ({
        storage,
        fileFilter,
        limits: {
            fileSize: maxSize
        }
    }).single(imageFile)

    // middleware
    return(req, res, next)=>{
        upload(req, res, function(err){
            if(err){
                if(err.code == "LIMIT_FILE_SIZE"){
                    req.session.message = {
                        type: 'danger',
                        message: "Error, max file size 10MB"
                    }
                    return res.redirect(req.originalUrl)
                }
                req.session.message = {
                    type:'danger',
                    message: err
                }

                req.flash('error', err)
                return res.redirect(req.originalUrl)
            }
            return next()
        })
    }
}