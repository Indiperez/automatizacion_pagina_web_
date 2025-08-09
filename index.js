const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

// Función para tomar la captura de pantalla y guardarla en disco
async function takeScreenshot(driver, filename) {
    let image = await driver.takeScreenshot();
    const screenshotPath = path.join(filename);
    fs.writeFileSync(screenshotPath, image, 'base64');
    console.log(`📸 Screenshot tomada: ${screenshotPath}`);
    return screenshotPath; // Devolver la ruta de la captura para incluirla en el reporte
}

async function handleAlertAndCapture(driver) {
    try {
        // Esperar a que la alerta esté presente
        const alert = await driver.wait(until.alertIsPresent(), 5000);
        
        // Capturar la pantalla justo antes de aceptar la alerta
        console.log('⚠️ Alerta detectada. Tomando captura antes de aceptar...');
        await takeScreenshot(driver, 'alerta-before-accept.png');

        // Aceptar la alerta (esto la cierra)
        console.log('⚠️ Aceptando la alerta...');
        await alert.accept();

    } catch (error) {
        console.log('⚠️ No se encontró ninguna alerta o ya fue manejada.');
    }
}

// Función para crear el reporte HTML
function generateReport(results) {
    let reportHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Automatización</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px; }
            h1 { color: #333; }
            .step { margin-bottom: 20px; }
            .step img { width: 100%; max-width: 600px; }
            .success { color: green; }
            .error { color: red; }
            .step-info { margin-top: 10px; }
        </style>
    </head>
    <body>
        <h1>Reporte de Automatización</h1>
        ${results.map(result => `
            <div class="step">
                <h2>Paso: ${result.step}</h2>
                <img src="${result.screenshot}" alt="Captura de pantalla">
                <div class="step-info">
                    <p class="${result.status === 'success' ? 'success' : 'error'}">${result.status}</p>
                    <p>${result.message}</p>
                </div>
            </div>
        `).join('')}
    </body>
    </html>
    `;
    
    const reportPath = path.join(__dirname, 'reporte_automatizacion.html');
    fs.writeFileSync(reportPath, reportHTML, 'utf8');
    console.log(`📝 Reporte generado: ${reportPath}`);
}


async function automateShop() {
    const driver = await new Builder().forBrowser('chrome').build();
    const results = [];

    try {
        // Ir a la página principal
        await driver.get('https://shoptenis.netlify.app/compras.html');
        await driver.sleep(2000);
        const screenshot1 = await takeScreenshot(driver, 'screenshot-01-inicio.png');
        results.push({ step: 'Página principal', screenshot: screenshot1, status: 'success', message: 'Página cargada correctamente.' });

        // Agregar un producto al carrito
        const addToCartBtn = await driver.wait(
            until.elementLocated(By.css('.agregar-carrito[data-id="1"]')),
            
        );
        await addToCartBtn.click();
        await driver.sleep(1000);
        const screenshot2 = await takeScreenshot(driver, 'screenshot-02-producto-agregado.png');
        results.push({ step: 'Producto agregado al carrito', screenshot: screenshot2, status: 'success', message: 'Producto agregado correctamente.' });

        // Hover sobre el ícono del carrito para mostrarlo
        const cartIcon = await driver.findElement(By.id('img-carrito'));
        await driver.actions({ bridge: true }).move({ origin: cartIcon }).perform();
        await driver.sleep(1000);
        const screenshot3 = await takeScreenshot(driver, 'screenshot-03-carrito-visible.png');
        results.push({ step: 'Carrito visible', screenshot: screenshot3, status: 'success', message: 'Carrito mostrado correctamente.' });

        // Hacer clic en "Pagar"
        const pagarBtn = await driver.findElement(By.css('a.pago'));
        await pagarBtn.click();

        // Esperar a que cargue la nueva página de pagos
        await driver.wait(until.urlContains('https://shoptenis.netlify.app/pagos'), 10000);
        await driver.sleep(1000);
        const screenshot4 = await takeScreenshot(driver, 'screenshot-04-pagina-pago.png');
        results.push({ step: 'Página de pago', screenshot: screenshot4, status: 'success', message: 'Página de pago cargada correctamente.' });

        // Llenar el formulario de pago
        await driver.findElement(By.id('nombre')).sendKeys('Eduardo Vallejo');
        await driver.findElement(By.id('direccion')).sendKeys('eduardo@example.com');
        await driver.findElement(By.id('telefono')).sendKeys('69837986298');
        await driver.findElement(By.id('tarjeta')).sendKeys('4111111111111111');
        await driver.findElement(By.id('fecha-mes')).sendKeys('1');
        await driver.findElement(By.id('fecha-anio')).sendKeys('26');
        await driver.findElement(By.id('cvc')).sendKeys('123');

        await driver.sleep(1000);
        const screenshot5 = await takeScreenshot(driver, 'screenshot-05-formulario-llenado.png');
        results.push({ step: 'Formulario de pago llenado', screenshot: screenshot5, status: 'success', message: 'Formulario llenado correctamente.' });

        

        // (Opcional) Hacer clic en el botón de enviar si existe
        const submitBtn = await driver.findElement(By.css('form button[type="submit"]'));
        await submitBtn.click();

        

        await driver.sleep(2000);
        const screenshot6 = await takeScreenshot(driver, 'screenshot-06-formulario-enviado.png');
        results.push({ step: 'Formulario enviado', screenshot: screenshot6, status: 'success', message: 'Formulario enviado correctamente.' });

        console.log('✅ Automatización completada con éxito.');
        generateReport(results); // Generar el reporte HTML al final de la automatización.

    } catch (error) {
        console.error('⚠️ Error en la automatización:', error);
        results.push({ step: 'Error', screenshot: '', status: 'error', message: error.message });
        generateReport(results); // Generar el reporte HTML en caso de error.
    } finally {
        await driver.quit(); // Cerrar el navegador
    }
}

automateShop();
