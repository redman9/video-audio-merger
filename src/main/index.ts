import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readdirSync, existsSync } from 'fs'
import { exec } from 'child_process'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('dialog:openFile', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    const fileNames = readdirSync(filePaths[0]).filter(
      (path) => path.endsWith('_audio.mp4') || path.endsWith('_video.mp4')
    )
    const resultObj = {}

    fileNames.forEach((fileName) => {
      const name = fileName.substring(0, fileName.length - 10)

      if (!resultObj[name]) {
        resultObj[name] = []
      }

      resultObj[name].push({
        name: fileName,
        path: path.resolve(filePaths[0], fileName)
      })
    })

    return Array.from(Object.values(resultObj))
  })
  ipcMain.handle('startCombine', async (_event, fileList) =>
    Promise.all(
      fileList.map(
        (fileGroup) =>
          new Promise((resolve) => {
            const filePath = fileGroup[0].path.substring(0, fileGroup[0].path.length - 10) + '.mp4'

            if (existsSync(filePath)) {
              resolve({
                success: false,
                group: fileGroup,
                msg: 'file already exists'
              })
            }
            exec(
              `ffmpeg -i "${fileGroup[0].path}" -i "${fileGroup[1].path}" -vcodec copy -acodec copy "${filePath}"`,
              (error, stdout, stderr) => {
                if (error) {
                  resolve({
                    success: false,
                    group: fileGroup
                  })
                }
                console.log(`stdout: ${stdout}`)
                console.log(`stderr: ${stderr}`)
                resolve({
                  success: true,
                  group: fileGroup,
                  msg: 'ffmpeg failed'
                })
              }
            )
          })
      )
    )
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
