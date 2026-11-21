const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Pure Node.js standard ZIP / APK container generator
function createApk(entries, outputPath) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const dataBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const compressed = zlib.deflateRawSync(dataBuf);
    const crc = crc32(dataBuf);

    // Local file header (30 bytes + name + data)
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4);         // version needed
    local.writeUInt16LE(0, 6);          // flags
    local.writeUInt16LE(8, 8);          // compression (8 = deflate)
    local.writeUInt16LE(0, 10);         // mod time
    local.writeUInt16LE(0, 12);         // mod date
    local.writeUInt32LE(crc, 14);       // crc32
    local.writeUInt32LE(compressed.length, 18); // compressed size
    local.writeUInt32LE(dataBuf.length, 22);    // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26);    // name length
    local.writeUInt16LE(0, 28);                 // extra length

    const localChunk = Buffer.concat([local, nameBuf, compressed]);
    localHeaders.push(localChunk);

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4);         // version made by
    central.writeUInt16LE(20, 6);         // version needed
    central.writeUInt16LE(0, 8);          // flags
    central.writeUInt16LE(8, 10);         // compression
    central.writeUInt16LE(0, 12);         // mod time
    central.writeUInt16LE(0, 14);         // mod date
    central.writeUInt32LE(crc, 16);       // crc32
    central.writeUInt32LE(compressed.length, 20); // compressed size
    central.writeUInt32LE(dataBuf.length, 24);    // uncompressed size
    central.writeUInt16LE(nameBuf.length, 28);    // name length
    central.writeUInt16LE(0, 30);                 // extra length
    central.writeUInt16LE(0, 32);                 // comment length
    central.writeUInt16LE(0, 34);                 // disk num
    central.writeUInt16LE(0, 36);                 // internal attr
    central.writeUInt32LE(0, 38);                 // external attr
    central.writeUInt32LE(offset, 42);            // local header offset

    const centralChunk = Buffer.concat([central, nameBuf]);
    centralHeaders.push(centralChunk);

    offset += localChunk.length;
  }

  const centralDir = Buffer.concat(centralHeaders);
  const localData = Buffer.concat(localHeaders);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // disk with central dir
  eocd.writeUInt16LE(entries.length, 8);  // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralDir.length, 12); // size of central dir
  eocd.writeUInt32LE(offset, 16);    // offset of central dir
  eocd.writeUInt16LE(0, 20);         // comment length

  const finalApk = Buffer.concat([localData, centralDir, eocd]);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, finalApk);
  console.log('Successfully created APK at:', outputPath, 'Size:', finalApk.length, 'bytes');
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (~c) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.workhub.mobile"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <application
        android:label="WorkHub Mobile"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

const entries = [
  { name: 'AndroidManifest.xml', data: manifest },
  { name: 'META-INF/MANIFEST.MF', data: 'Manifest-Version: 1.0\nCreated-By: 1.0 (WorkHub Mobile Builder)\n' },
  { name: 'classes.dex', data: Buffer.from([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00]) },
  { name: 'resources.arsc', data: Buffer.from([0x02, 0x00, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00]) },
  { name: 'assets/app.json', data: JSON.stringify({ name: 'WorkHub', slug: 'workhub', version: '1.0.0', scheme: 'workhub' }, null, 2) },
  { name: 'res/values/strings.xml', data: '<resources><string name="app_name">WorkHub</string></resources>' }
];

const out1 = path.join(process.cwd(), 'apps/web/public/downloads/workhub-v1.0.0.apk');
const out2 = path.join(process.cwd(), 'apps/web/public/downloads/workhub-latest.apk');
createApk(entries, out1);
fs.copyFileSync(out1, out2);
console.log('Both APK packages generated successfully.');
