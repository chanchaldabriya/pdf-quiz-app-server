const fs = require('fs');
const pdfParse = require('pdf-parse');

const parseQuestions = (pdfText) => {
    const questions = [];  
    let isProcessStart = false, isQuesParsed = true;
    let isOption = false, isStatement = false, isQuestion = false;
    const quesPattern = /^[0-9]+\.\s/;
    const statementPattern = /^[0-9]\.\s/;
    const optionPattern = /^\([a-d]\)/;
    const excludeStrings = ["vision", "ias"];
    const excludePattern = new RegExp(excludeStrings.join("|"), "i");
    const textLines = pdfText.split('\n');
    let currQues = {description: "", options: []};
    textLines.filter(line => line.trim().length)
        .forEach(line => {
            if(!isProcessStart) {
                // avoid all other lines until questions start
                isProcessStart = quesPattern.test(line);
            }
            if (isProcessStart) {
                line = line.trim();
                if(isQuesParsed && quesPattern.test(line)) {
                    // question
                    if(isOption) {
                        isOption = false;
                        questions.push({...currQues});

                        // clear currQues
                        currQues.description = "";
                        currQues.options = [];
                    }
                    const ques = line.split(quesPattern)[1].trim();
                    currQues.description += ques;
                    isQuesParsed = false;
                    isQuestion = true;    
                } else {
                    // only question pattern will start the process
    
                    if(statementPattern.test(line)) {
                        // statement
                        currQues.description = currQues.description.concat("\n", line);
                        isQuestion = false;
                        isOption = false;
                        isStatement = true;
                    } else if(optionPattern.test(line)) {
                        // option
                        currQues.options.push(line);
                        isQuesParsed = true;
                        isQuestion = false;
                        isStatement = false;
                        isOption = true;
                    } else if (!excludePattern.test(line)) {
                        // continued line
                        if(isOption)
                            currQues.options[currQues.options.length - 1] += (" " + line);
                        else if(isQuestion)
                            currQues.description = currQues.description.concat(currQues.description.endsWith(':') || currQues.description.endsWith('.') ? "\n" : " ", line);
                        else if(isStatement) {
                            // currQues.description = currQues.description.concat(currQues.description.endsWith('.') ? "\n" : " ", line);
                            currQues.description = currQues.description.concat("\n", line);
                        }
                            
                    }
                }
            }
        });
    
    if(currQues.description)
        questions.push(currQues);

    return questions;
};

const parseAnswers = (pdfText) => {
    const answers = [];
    const ansPattern = /^\([a-d]\)/;
    const textLines = pdfText.split('\n');

    let foundAnswer = true;
    let counter = 1;
    let carriedOverOption;
    textLines.forEach(line => {
        line = line.trim();
        if (line.length && (ansPattern.test(line) || !foundAnswer)) {
            foundAnswer = false;

            let [ correctOption, questionNumber ] = line.split("Q.");
            correctOption = correctOption ? correctOption.trim() : "";
            questionNumber = questionNumber ? questionNumber.trim() : "";

            correctOption = correctOption || carriedOverOption;

            if (correctOption && questionNumber && counter === parseInt(questionNumber)) {
                answers.push(correctOption);
                counter++;
                foundAnswer = true;
                carriedOverOption = "";
            } else {
                carriedOverOption = correctOption;
            }
        }
    });

    return answers;
};

// const getQuestionsFromPdf = (callback) => {
//     try {
//         // const fileData = fs.readFileSync('./sample.pdf');
//         const fileData = fs.readFileSync('./VisionIAS_TestBooklet.pdf');
    
//         pdfParse(fileData, {startPage: 2}).then(function(data) {
//             // number of pages
//             // console.log(data.numpages);
//             // number of rendered pages
//             // console.log(data.numrender);
//             // PDF info
//             // console.log(data.info);
//             // PDF metadata
//             // console.log(data.metadata); 
//             // PDF.js version
//             // check https://mozilla.github.io/pdf.js/getting_started/
//             // console.log(data.version);
//             // PDF text
//             // console.log(data.text.slice(0, 535));
//             if (typeof callback === "function") {
//                 callback(parseQuestions(data.text));
//             }
//         }).catch(function(error) {
//             // handle pdf file read exceptions
//             console.log(error); 
//         })
//     } catch (err) {
//         console.error(err);
//     }
// };

const readPdf = (filePath, handler, options = {}) => {
    if (!filePath)
        return;

    const {
        startPage = 0,
        maxPages = 0
    } = options;

    console.log("readPdf - startPage: ", startPage);
    console.log("readPdf - maxPages: ", maxPages);

    try {
        // const fileData = fs.readFileSync('./sample.pdf');
        // './VisionIAS_TestBooklet.pdf'
        console.log(filePath);
        const fileData = fs.readFileSync(filePath);
    
        return pdfParse(fileData, {startPage: startPage, max: maxPages}).then(function(data) {
            // number of pages
            // console.log(data.numpages);
            // number of rendered pages
            // console.log(data.numrender);
            // PDF info
            // console.log(data.info);
            // PDF metadata
            // console.log(data.metadata); 
            // PDF.js version
            // check https://mozilla.github.io/pdf.js/getting_started/
            // console.log(data.version);
            // PDF text
            // console.log(data.text.slice(0, 535));
            if (typeof handler === "function") {
                // console.log("dataText", data.text.slice(0, 535));
                return handler(data.text);
            }
        }).catch(function(error) {
            // handle pdf file read exceptions
            console.log(error); 
        })
    } catch (err) {
        console.error(err);
    }
};

const getQuestionsFromPdf = (filePath, options) => {
    const {
        startPage: startPageString = "0",
        maxPages: maxPagesString = "0"
    } = options || {};

    console.log("getQuestionsFromPdf - options:", JSON.stringify(options));
    const startPage = isNaN(parseInt(startPageString)) ? 0 : parseInt(startPageString);
    const maxPages = isNaN(parseInt(maxPagesString)) ? 0 : parseInt(maxPagesString);

    console.log("getQuestionsFromPdf - startPage:", startPage);
    console.log("getQuestionsFromPdf - maxPages:", maxPages);

    return readPdf(filePath, parseQuestions, { startPage, maxPages });
};

const getAnswersFromPdf = (filePath, options) => {
    const {
        startPage: startPageString = "0",
        maxPages: maxPagesString = "0"
    } = options || {};

    const startPage = isNaN(parseInt(startPageString)) ? 0 : parseInt(startPageString);
    const maxPages = isNaN(parseInt(maxPagesString)) ? 0 : parseInt(maxPagesString);

    return readPdf(filePath, parseAnswers, { startPage, maxPages });
};

module.exports = {
    getQuestionsFromPdf: getQuestionsFromPdf,
    getAnswersFromPdf: getAnswersFromPdf
}