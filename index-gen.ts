import * as path from "jsr:@std/path"

interface DirectoryAndFiles {
  directory: string,
  fileNames: string[]
}

const KB_SIZE = 1024
const MB_SIZE = KB_SIZE ** 2
const GB_SIZE = MB_SIZE ** 2

const ROOT_DIR: string = "./"
const directories: DirectoryAndFiles[] = []

await recursivelyScanDir(ROOT_DIR)

async function recursivelyScanDir(prefix: string): Promise<void> {
  const dirAndFiles: DirectoryAndFiles = {
    directory: prefix,
    fileNames: []
  }
  directories.push(dirAndFiles)

  if (prefix != ROOT_DIR) {
    dirAndFiles.fileNames.push("..")
  }

  for await (const entry of Deno.readDir(prefix)) {
    const name = entry.name
    if (name.startsWith(".") || name == "index.html") {
      continue
    }

    if (!entry.isDirectory) {
      dirAndFiles.fileNames.push(name)
      continue
    } else {
      dirAndFiles.fileNames.push(name + "/")
    }

    const fpath = path.join(prefix, name).replaceAll("\\", "/")
    await recursivelyScanDir(fpath)
  }
}

for (const e of directories) {
  const indexPath = path.join(e.directory, "index.html")
  console.log(indexPath)

  let fileElements: string = ""

  for (const fname of e.fileNames) {
    let fullpath = ""
    if (e.directory != ROOT_DIR) {
      fullpath += e.directory + "/"
    }
    fullpath += fname

    let statPath = path.join(e.directory, fname)
    let stat = await Deno.stat(statPath)

    let type = stat.isDirectory ? "directory" : "file"

    fileElements += `<tr><td><a href="/${fullpath}">${fname}</a></td><td>${fileSizeDisplay(stat.size)}</td><td>${type}</td></tr>`
  }

  const content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e.directory}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <table>
    <caption>File List</caption>
    <thead>
      <tr>
        <th>File name</th>
        <th>Size</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      ${fileElements}
    </tbody>
  </table>
</body>
</html>`

  await Deno.writeTextFile(indexPath, content)
}

function fileSizeDisplay(fsize: number): string {
  let divisor = 0
  let unit = ""

  if (fsize < KB_SIZE) {
    divisor = 1
    unit = " bytes"
  } else if (fsize < MB_SIZE) {
    divisor = KB_SIZE
    unit = "kb"
  } else if (fsize < GB_SIZE) {
    divisor = MB_SIZE
    unit = "mb"
  } else {
    divisor = GB_SIZE
    unit = "gb"
  }

  const divided = Math.ceil(fsize / divisor)
  return `${divided.toFixed(0)}${unit}`
}