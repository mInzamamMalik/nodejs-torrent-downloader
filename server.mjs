import torrentStream from 'torrent-stream';
import fs from 'fs';
import progressStream from 'progress-stream';
import express from 'express';

const magnetURI = `magnet:?xt=urn:btih:01bee8329e244976375734711f32845559a95677&dn=Babylon%20(2022)%20%5b2160p%5d%20%5b4K%5d%20%5bWEB%5d%20%5b5.1%5d%20%5bYTS.MX%5d&tr=udp%3a%2f%2ftracker.opentrackr.org%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.leechers-paradise.org%3a6969%2fannounce&tr=udp%3a%2f%2f9.rarbg.to%3a2710%2fannounce&tr=udp%3a%2f%2fp4p.arenabg.ch%3a1337%2fannounce&tr=udp%3a%2f%2ftracker.cyberia.is%3a6969%2fannounce&tr=http%3a%2f%2fp4p.arenabg.com%3a1337%2fannounce&tr=udp%3a%2f%2fopen.tracker.cl%3a1337%2fannounce`;

const engine = torrentStream(magnetURI);
let file;
const savePath = './downloads/Babylon_4k.mkv'; // change the file name as needed

if (!fs.existsSync('./downloads')) {
    fs.mkdirSync('./downloads');
}

engine.on('ready', () => {
    console.log(`Downloading: ${engine.torrent.name}`);
    console.log(`Total size: ${engine.torrent.length}`);

    file = engine.files[0];
    const stream = file.createReadStream();

    let downloaded = 0;
    let total = 0;

    stream.on('data', data => {
        downloaded += data.length;
        console.log(`Downloaded: ${downloaded}`);

        total = downloaded / engine.torrent.length * 100;
        console.log(`Progress: ${total}%`);
    });

    engine.on('download', () => {
        const numPeers = engine.swarm.wires.length;
        const numPieces = engine.torrent.pieces.length;
        const numDownloaded = engine.swarm.downloaded;
        const numUploaded = engine.swarm.uploaded;
        const progress = engine.swarm.downloaded / engine.torrent.length * 100;

        console.log(`Collecting seeds: ${numPeers} peers, ${numDownloaded}/${engine.torrent.length} downloaded, ${numUploaded} uploaded, ${numPieces - engine.swarm.numMissing} pieces verified`);
        console.log(`Progress: ${progress}%`);
    });

    // log the number of available seeders when the engine connects to peers
    engine.on('peers', peers => {
        const numSeeders = peers.filter(peer => !peer.amChoking).length;
        console.log(`Connected to ${numSeeders} seeders`);
    });


    stream.pipe(fs.createWriteStream(savePath));

    engine.on('idle', () => {
        console.log('Download completed');
        engine.destroy();
    });
});

const app = express();
const port = 3000; // replace with the desired port number
const outputFolder = './downloads'; // replace with the desired output folder path

// make sure the output folder exists
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
}



// define the API endpoint for downloading a file
app.get('/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = `${outputFolder}/${fileName}`;

    // check if the file exists
    if (!fs.existsSync(filePath)) {
        res.status(404).send('File not found');
        return;
    }

    // set the response headers for the file download
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/octet-stream');

    // create a read stream for the file and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

// start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

