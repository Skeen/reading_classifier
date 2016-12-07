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

// Process args
var options = require('commander');
var pjson = require('./package.json');
options
	.version(pjson.version)
	.description(pjson.description + ".")
	.usage('[options]')
	.option('-r, --reference <file>', 'Specify the used reference set. Required.')
	.option('-k, --knn <number>','Consider only the \'k\' nearest neighbours', parseInt)
	.option('-S, --statistics <file>','Specify the model to use. Optional')
	.option('-n, --statistics-deviation <number>','Number of standard devations to use.', parseFloat)
	.option('-q, --statistics-cutoff <number>','Cut neighbours of site, if less than n are statisically likely.', parseInt)
	.option('-f, --fractional', 'Generate a fractional confusion matrix')
	.option('-F, --fractInt <number>','Generate confusion matrix using fractionals, but only with n largest', parseInt)
	.option('-h, --help', '');

options.parse(process.argv);

if(!options.reference)
{
	console.error("No reference set provided! It is required.");
	process.exit(1);
}

console.log('Using these sets:');
console.log("Reference name", options.reference);
console.log("Model name", options.statistics);
console.log("knn", options.knn);
console.log("stat-dev", options.statisticsDeviation);
console.log("stat-cut", options.statisticsCutoff);
console.log("f", options.fractional);
console.log("F", options.fractInt);

//Bash script
var exec = require('child_process').exec;
var bash_chain = './one_chain.sh';
var bash_chain_model = "./one_chain_model.sh"
var run_bash_chain = function(query_path, query_name, callback)
{
	if(options.statistics)
	{
		var args = '"'
		   		+ ' --statistics-deviation=' + (options.statisticsDeviation || 1.5) 
				+ ' --statistics-cutoff=' + (options.statisticsCutoff || 10)
				+ ' --knn=' + (options.knn || 0);
		if(options.fractional)
			args = args + ' -f';
	   	else if(options.fractInt)
			args = args + ' --fractInt=' + options.F;	
	    
		args = args + '"';

		exec(bash_chain_model
			+ ' ' + query_path
			+ ' ' + query_name 
			+ ' ' + options.reference
			+ ' ' + options.statistics
			+ ' ' +  args,
			{maxBuffer: Number.POSITIVE_INFINITY},
        	    callback);
	}
	else
	{
		exec(bash_chain 
			+ ' ' + query_path
			+ ' ' + query_name 
			+ ' ' + options.reference,
			{maxBuffer: Number.POSITIVE_INFINITY},
				callback);
	}
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
    console.log("Recieved classification request.");
	console.log(path);
    console.log(filename);
    // Now process
    if(filename.endsWith('.csv') || filename.endsWith('.raw'))
    {
        run_bash_chain(path, filename, function(err, result)
        {
            if(err)
            {
                console.error("Error running bash chain");
                console.error(err);
                return;
            }
            else
            {
				console.log("Responsing with classification result:");
				console.log(result);
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
