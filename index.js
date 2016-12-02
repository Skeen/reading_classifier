var express = require('express');
var multer  = require('multer');
var cors    = require('cors');
var mkdirp  = require('mkdirp');

var app = express();
app.use(cors());

var upload_folder  = 'uploads';

// Ensure that folders are created
var folder_callback = function(err) { if(err) console.error(err); };
mkdirp(upload_folder, folder_callback);

// Serve contents of uploads folder
var directory = require('serve-index');
app.use('/uploads/', directory(upload_folder, {'icons': true}));
app.use('/uploads/', express.static(upload_folder + '/'));

var exec = require('child_process').exec;
var bash_chain = './one_chain.sh';
var run_bash_chain = function(query, query_name, reference, callback)
{
    exec(bash_chain + ' ' + query + ' ' + query_name + ' ' + reference,
        {maxBuffer: Number.POSITIVE_INFINITY},
            callback);
}

// Upload file to server
var upload = multer({ dest: upload_folder + '/' });
app.post('/upload', upload.single('file'), function(req, res, next) 
{
    // Ensure that a file was provided
    if(req.file === undefined)
    {
        res.status(400);
        res.end("Missing payload: file");
        return;
    }
    // ... and a file name
    if(req.body.filename === undefined)
    {
        res.status(400);
        res.end("Missing payload: filename");
        return;
    }
    // Read them out
    var path = req.file.path;
    var filename = req.body.filename;
    // ... and print them
    console.log(path);
    console.log(filename);
    // Now process
    if(filename.endsWith('.csv') || filename.endsWith('.raw'))
    {
        run_bash_chain(path, filename, process.argv[2], function(err, result)
        {
            if(err)
            {
                console.error("Error running bash chain");
                console.error(err);
                return;
            }
            else
            {
                res.status(200);
                res.end(result);
            }
        });
    }
    else
    {
        res.status(200);
        res.end("Ignored, not processable!");
    }
});

app.get('/', function(req, res)
{
    res.sendFile("index.html", {root: __dirname});
});

var port = 3003;
app.listen(port, function() 
{
    console.log('Reading reciever server on port: ' + port);
});
