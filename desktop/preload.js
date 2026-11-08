const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('tambouilleDesktop', { platform: process.platform });
