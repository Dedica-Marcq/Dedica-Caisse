const path = require("path");

module.exports = {
  packagerConfig: {
    name: "DedicaCaisse",
    executableName: "DedicaCaisse",
    appBundleId: "com.dedica-marcq.Dedica-Caisse",
    appCategoryType: "public.app-category.business",
    icon: path.resolve(__dirname, "src/images/icons/icon"),
    overwrite: true,
    asar: true,
    extraResources: [
      {
        from: path.resolve(__dirname, "src/images"),
        to: "images"
      }
    ],
  },

  rebuildConfig: {},

  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: {
        options: {
          platform: "darwin",
          arch: ["x64", "arm64"],
        },
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        format: "ULFO",
        icon: path.resolve(__dirname, "src/images/icons/icon.icns"),
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "DedicaCaisse",
        authors: "Basile Bargibant",
        description: "Logiciel de caisse pour le salon du livre Dédica’Marcq",
        exe: "DedicaCaisse.exe",
        setupExe: "DedicaCaisse-Setup.exe",
        setupIcon: path.resolve(__dirname, "src/images/icons/icon.ico"),
        noMsi: true,
        shortcutFolderName: "DedicaCaisse",
        menuShortcut: true,
        desktopShortcut: true,
        startMenuShortcut: true,
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["win32"],
      config: {
        arch: "x64",
      },
    },
  ],
};