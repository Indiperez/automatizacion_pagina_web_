const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

const localFilePath = 'https://shoptenis.netlify.app';

async function takeScreenshot(driver, filename) {
    let image = await driver.takeScreenshot();
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
    fs.writeFileSync('reporte_login.html', html);
    console.log('✅ Reporte generado en reporte_login.html');
}

(async function runLoginAutomation() {
    const driver = await new Builder().forBrowser('chrome').build();
    const steps = [];

    try {
        await driver.get(localFilePath);
        await driver.sleep(1000);
        steps.push({ titulo: 'Pantalla inicial cargada', mensaje: 'Formulario de login visible.', estado: 'success', captura: await takeScreenshot(driver, '01-inicio.png') });

        
        await driver.findElement(By.id('switch-to-register')).click();
        await driver.sleep(2000);
        steps.push({ titulo: 'Formulario de registro', mensaje: 'Formulario de registro mostrado correctamente.', estado: 'success', captura: await takeScreenshot(driver, '02-registro-form.png') });

        const username = 'eduardo_test';
        const password = 'clave123';
        await driver.findElement(By.id('new-user')).sendKeys(username);
        await driver.findElement(By.id('new-pass')).sendKeys(password);
        await driver.sleep(3000);
        await driver.findElement(By.id('register-btn')).click();
        steps.push({ titulo: 'Registro exitoso', mensaje: 'Usuario registrado y formulario de login reaparecido.', estado: 'success', captura: await takeScreenshot(driver, '03-registrado.png') });

        
        await driver.findElement(By.id('login-user')).sendKeys(username);
        await driver.findElement(By.id('login-pass')).sendKeys(password);
        steps.push({ titulo: 'Formulario login lleno', mensaje: 'Campos del login llenados.', estado: 'success', captura: await takeScreenshot(driver, '05-login-lleno.png') });

        
        await driver.findElement(By.id('login-btn')).click();
        await driver.sleep(1000);

    } catch (error) {
        steps.push({ titulo: 'Error general', mensaje: error.message, estado: 'error', captura: null });
    } finally {
        await driver.quit();
        generateReport(steps);
    }
})();
