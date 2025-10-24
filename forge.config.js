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
    extraResource: [
      path.resolve(__dirname, "src/images/"),
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
        icon: "./src/images/icons/icon.icns",
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
        setupIcon: "./src/images/icons/icon.ico",
        noMsi: true,
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
   publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "Dedica-Marcq",
          name: "Dedica-Caisse",
        },
        prerelease: true, // change en false pour une release stable
        draft: false,     // met true si tu veux que la release reste en brouillon
      },
    },
  ],
};