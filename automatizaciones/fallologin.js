const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

// URL del sitio
const localFilePath = 'https://shoptenis.netlify.app';

async function takeScreenshot(driver, filename) {
    const image = await driver.takeScreenshot();
    fs.writeFileSync(filename, image, 'base64');
    return filename;
}

function generateReport(steps) {
    const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; background: #eee; padding: 20px; }
          h2 { color: #333; }
          .step { margin-bottom: 30px; }
          .success { color: green; }
          .error { color: red; }
          .info { color: blue; }
          img { max-width: 600px; margin-top: 10px; border: 1px solid #ccc; }
        </style>
        <title>Reporte Automatización</title>
      </head>
      <body>
        <h1>Reporte de Automatización de Login y Registro</h1>
        ${steps.map(step => `
          <div class="step">
            <h2>${step.titulo}</h2>
            <p class="${step.estado}">${step.mensaje}</p>
            ${step.captura ? `<img src="${step.captura}" />` : ''}
          </div>`).join('')}
      </body>
    </html>
    `;
    fs.writeFileSync('reporte_login_fallido.html', html);
    console.log('✅ Reporte generado en reporte_login_fallido.html');
}

(async function runLoginAutomation() {
    const driver = await new Builder().forBrowser('chrome').build();
    const steps = [];

    try {
        console.log('🌐 Abriendo sitio...');
        await driver.get(localFilePath);
        await driver.sleep(1000);
        steps.push({ titulo: 'Pantalla inicial cargada', mensaje: 'Formulario de login visible.', estado: 'success', captura: await takeScreenshot(driver, '01-inicio.png') });

        console.log('🔁 Cambiando al formulario de registro...');
        await driver.findElement(By.id('switch-to-register')).click();
        await driver.sleep(2000);
        steps.push({ titulo: 'Formulario de registro', mensaje: 'Formulario de registro mostrado correctamente.', estado: 'success', captura: await takeScreenshot(driver, '02-registro-form.png') });

        // Registro (datos correctos para esta parte)
        console.log('📝 Llenando registro...');
        const username = 'eduardo_test';
        const password = 'clave123';
        await driver.findElement(By.id('new-user')).sendKeys(username);
        await driver.sleep(500);
        await driver.findElement(By.id('new-pass')).sendKeys(password);
        await driver.sleep(1000);
        await driver.findElement(By.id('register-btn')).click();
        steps.push({ titulo: 'Registro exitoso', mensaje: 'Usuario registrado y formulario de login reaparecido.', estado: 'success', captura: await takeScreenshot(driver, '03-registrado.png') });

        // Cambio a login
        console.log('🔁 Cambiando al login...');
        await takeScreenshot(driver, '04-antes-de-switch-login.png');
        await driver.sleep(1000);
        await takeScreenshot(driver, '04-despues-de-switch-login.png');

        // Datos incorrectos para login fallido
        console.log('📝 Llenando login con datos incorrectos...');
        const badUsername = 'usuario_incorrecto';
        const badPassword = 'clave_incorrecta';
        await driver.findElement(By.id('login-user')).sendKeys(badUsername);
        await driver.findElement(By.id('login-pass')).sendKeys(badPassword);
        steps.push({ titulo: 'Formulario login lleno con datos incorrectos', mensaje: 'Campos del login llenados con datos incorrectos.', estado: 'success', captura: await takeScreenshot(driver, '05-login-incorrecto.png') });

        // Clic en login
        await driver.findElement(By.id('login-btn')).click();

        // Manejo de alerta (si existe)
        try {
            await driver.wait(until.alertIsPresent(), 2000);
            const alert = await driver.switchTo().alert();
            const alertText = await alert.getText();
            await alert.accept();
            steps.push({ titulo: 'Alerta detectada', mensaje: `Se aceptó la alerta: "${alertText}"`, estado: 'success', captura: await takeScreenshot(driver, 'alerta-login-fallido.png') });
        } catch (e) {
            steps.push({ titulo: 'Alerta no detectada', mensaje: 'No apareció ninguna alerta tras hacer login con datos incorrectos.', estado: 'info', captura: await takeScreenshot(driver, 'sin-alerta-login-fallido.png') });
        }

        // Verificar si el login fue exitoso (esperamos que no se redirija)
        await driver.sleep(1000);
        const urlActual = await driver.getCurrentUrl();
        if (!urlActual.includes('compras.html')) {
            steps.push({ titulo: 'Login fallido', mensaje: 'El login falló, no se redirigió a compras.html.', estado: 'error', captura: await takeScreenshot(driver, '06-login-fallido.png') });
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        steps.push({ titulo: 'Error general', mensaje: error.message, estado: 'error', captura: null });
    } finally {
        await driver.quit();
        generateReport(steps);
    }
})();
