const Koa = require('koa');
const fs = require('fs');
const app = module.exports = new Koa();

// TODO: handle error at 'Error: write EPIPE'
app.use(async function (ctx) {
    const videoPath = 'videos/sample.mp4'
    const fstat = await stat(videoPath);
    const fileSize = fstat.size
    const range = ctx.request.headers.range || null

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1

        const chunksize = (end - start) + 1
        const file = fs.createReadStream(videoPath, { start, end })
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
        }
        ctx.set(head)
        ctx.status = 206
        ctx.body = file

    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4'
        }
        ctx.set(head)
        ctx.status = 200
        ctx.body = fs.createReadStream(videoPath);
    }
});

function stat(file) {
    return new Promise(function (resolve, reject) {
        fs.stat(file, function (err, stat) {
            if (err) {
                reject(err);
            } else {
                resolve(stat);
            }
        });
    });
}

if (!module.parent) app.listen(3000);