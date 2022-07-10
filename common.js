const fs = require('fs');

const deleteFile = (filePath) => {
    fs.unlink(filePath, function(err) {
        if(err) return console.log(err);
        console.log('file deleted successfully');
    });
};

module.exports = {
    deleteFile
}