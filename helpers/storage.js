import multer from "multer";
import md5 from "md5";
import path from "path";

const diskStorageDifferent = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    //   cb(null, file.originalname);
    var filepath = md5(Date.now() + req.user._id);
    const mimeType = file.mimetype.split("/");
    var fileType = mimeType[1];
    if (fileType == "vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      fileType = "xlsx";
    } else if (fileType == "text/plain") {
      fileType = "txt";
    } else if (fileType == "text/csv") {
      fileType = "csv";
    } else if (fileType == "vnd.ms-excel") {
      fileType = "xls";
    } else if (
      fileType == "vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileType = "docx";
    } else if (fileType == "msword") {
      fileType = "doc";
    } else if (
      fileType ==
      "vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      fileType = "pptx";
    } else if (fileType == "vnd.ms-powerpoint") {
      fileType = "ppt";
    } else {
      fileType = mimeType[1];
    }
    const fileName = filepath + "." + fileType;
    filepath = filepath + "." + fileType;
    cb(null, fileName);
  },
});

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    var filepath = md5(Date.now() + req.user._id);
    const mimeType = file.mimetype.split("/");
    var fileType = mimeType[1];
    if (fileType == "vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      fileType = "xlsx";
    } else if (fileType == "text/plain") {
      fileType = "txt";
    } else if (fileType == "text/csv") {
      fileType = "csv";
    } else if (fileType == "vnd.ms-excel") {
      fileType = "xls";
    } else if (
      fileType == "vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileType = "docx";
    } else if (fileType == "msword") {
      fileType = "doc";
    } else if (
      fileType ==
      "vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      fileType = "pptx";
    } else if (fileType == "vnd.ms-powerpoint") {
      fileType = "ppt";
    } else {
      fileType = mimeType[1];
    }
    const fileName = filepath + "." + fileType;
    filepath = filepath + "." + fileType;
    cb(null, fileName);
  },
});
const diskStorageMultiple = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    var filepath = md5(Date.now());
    const mimeType = file.mimetype.split("/");
    var fileType = mimeType[1];
    if (fileType == "vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      fileType = "xlsx";
    } else if (fileType == "text/plain") {
      fileType = "txt";
    } else if (fileType == "text/csv") {
      fileType = "csv";
    } else if (fileType == "vnd.ms-excel") {
      fileType = "xls";
    } else if (
      fileType == "vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileType = "docx";
    } else if (fileType == "msword") {
      fileType = "doc";
    } else if (
      fileType ==
      "vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      fileType = "pptx";
    } else if (fileType == "vnd.ms-powerpoint") {
      fileType = "ppt";
    } else {
      fileType = mimeType[1];
    }
    const fileName = filepath + "." + fileType;
    cb(null, fileName);
  },
});
const diskStorageVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    console.log(file.mimetype);
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  cb(null, true);
};
const fileFilterVideo = (req, file, cb) => {
  if (file.mimetype === "video/mp4") {
    cb(null, true);
  } else {
    cb({ message: "Unsupported File Format" }, false);
  }
};

const storage = multer({ storage: diskStorage, fileFilter: fileFilter }).single(
  "file"
);

const storageDifferent = multer({ storage: diskStorageDifferent }).fields([
  { name: "logo", maxCount: 1 },
  { name: "trademark", maxCount: 1 },
]);

const storageMultiple = multer({
  storage: diskStorageMultiple,
  fileFilter: fileFilter,
}).array("files");

const uploadVideo = multer({
  storage: diskStorageVideo,
  fileFilter: fileFilterVideo,
}).single("file");

export { storage, storageMultiple, uploadVideo, storageDifferent };
