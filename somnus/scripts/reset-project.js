#!/usr/bin/env node

/**
 * Script para reiniciar el proyecto.
 *
 * - Mueve o elimina carpetas antiguas
 * - Crea un nuevo /app limpio
 * - Genera index.tsx y _layout.tsx básicos
 *
 * Úsalo solo si quieres empezar desde cero.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Carpeta raíz del proyecto
const root = process.cwd();

// Carpetas que se borran o se mueven
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];

// Carpeta backup
const exampleDir = "app-example";
const newAppDir = "app";

const exampleDirPath = path.join(root, exampleDir);

// Contenido inicial del index
const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

// Layout básico de navegación
const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

// Consola interactiva
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Función principal del reset
const moveDirectories = async (userInput) => {
  try {
    // Crear carpeta backup si elige mover archivos
    if (userInput === "y") {
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
    }

    // Mover o borrar carpetas existentes
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);

      if (!fs.existsSync(oldDirPath)) continue;

      if (userInput === "y") {
        await fs.promises.rename(
          oldDirPath,
          path.join(root, exampleDir, dir)
        );
      } else {
        await fs.promises.rm(oldDirPath, { recursive: true, force: true });
      }
    }

    // Crear nuevo /app
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });

    // Crear archivos base
    await fs.promises.writeFile(
      path.join(newAppDirPath, "index.tsx"),
      indexContent
    );

    await fs.promises.writeFile(
      path.join(newAppDirPath, "_layout.tsx"),
      layoutContent
    );

    console.log(" Proyecto reiniciado correctamente.");
  } catch (error) {
    console.error(" Error al reiniciar el proyecto:", error.message);
  }
};

// Pregunta al usuario si mover o borrar
rl.question(
  "Move files to /app-example instead of deleting? (Y/n): ",
  (answer) => {
    const input = answer.trim().toLowerCase() || "y";

    if (input === "y" || input === "n") {
      moveDirectories(input).finally(() => rl.close());
    } else {
      console.log("Solo se acepta Y o N");
      rl.close();
    }
  }
);
