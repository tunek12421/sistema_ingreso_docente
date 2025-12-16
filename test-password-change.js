const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Interceptar requests de red
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('localhost:8081')) {
      const status = response.status();
      let body = '';
      try {
        body = await response.text();
      } catch (e) {}
      apiResponses.push({ url, status, body: body.substring(0, 500) });
      console.log(`   [API] ${status} ${url}`);
    }
  });

  // Interceptar errores de consola
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`   [Console Error] ${msg.text()}`);
    }
  });

  console.log('=== Test: Cambio de Contraseña de Usuario ===\n');

  try {
    // 1. Ir al login
    console.log('1. Navegando al login...');
    await page.goto('http://localhost:4200/login');
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Página de login cargada');

    // 2. Login como admin
    console.log('2. Iniciando sesión como admin...');
    await page.waitForSelector('input', { timeout: 5000 });
    await page.fill('input[type="text"], input[formcontrolname="username"], input[name="username"]', 'admin');
    await page.fill('input[type="password"], input[formcontrolname="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    console.log('   ✓ Formulario enviado');

    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}`);

    if (currentUrl.includes('admin')) {
      console.log('   ✓ Login exitoso');
    }

    // 3. Ir a la lista de usuarios
    console.log('3. Navegando a gestión de usuarios...');
    await page.goto('http://localhost:4200/admin/usuarios');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log(`   URL: ${page.url()}`);

    // 4. Esperar que cargue la tabla
    console.log('4. Esperando tabla de usuarios...');
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('   ✓ Tabla cargada');

    // 5. Buscar y hacer click en el primer botón de cambiar contraseña
    console.log('5. Buscando botón de cambiar contraseña...');
    const passwordBtn = await page.locator('button[title="Cambiar contraseña"]').first();

    if (await passwordBtn.isVisible()) {
      console.log('   ✓ Botón encontrado, haciendo click...');
      await passwordBtn.click();
      await page.waitForTimeout(1000);

      // 6. Verificar si se abrió el modal
      console.log('6. Verificando modal...');
      const modal = await page.locator('[role="dialog"], .fixed.inset-0').first();
      const modalVisible = await modal.isVisible();
      console.log(`   Modal visible: ${modalVisible}`);

      if (modalVisible) {
        // 7. Llenar formulario
        console.log('7. Llenando formulario de contraseña...');

        // Esperar que los campos estén disponibles
        await page.waitForSelector('#newPassword', { timeout: 5000 });

        // Llenar campos
        await page.fill('#newPassword', 'NuevaPass123');
        await page.fill('#confirmPassword', 'NuevaPass123');
        console.log('   ✓ Contraseñas ingresadas');

        // Esperar que el formulario sea válido
        await page.waitForTimeout(500);

        // 8. Verificar estado del botón submit
        console.log('8. Verificando botón de submit...');
        const submitBtn = await page.locator('button[type="submit"]').first();
        const isDisabled = await submitBtn.isDisabled();
        console.log(`   Botón deshabilitado: ${isDisabled}`);

        if (!isDisabled) {
          console.log('   Haciendo click en "Cambiar Contraseña"...');
          await submitBtn.click();

          // Esperar respuesta de API
          await page.waitForTimeout(3000);

          console.log('\n9. Respuestas de API capturadas:');
          const passwordResponses = apiResponses.filter(r => r.url.includes('password'));
          if (passwordResponses.length === 0) {
            console.log('   ⚠ NO SE CAPTURARON RESPUESTAS DE API PARA PASSWORD');
            console.log('   Todas las respuestas:');
            apiResponses.forEach(r => {
              console.log(`     ${r.status} ${r.url}`);
            });
          } else {
            for (const resp of passwordResponses) {
              console.log(`   ${resp.status} ${resp.url}`);
              console.log(`   Body: ${resp.body}`);
            }
          }
        } else {
          console.log('   ✗ Botón está deshabilitado - el formulario es inválido');

          // Verificar errores de validación
          const errors = await page.locator('.text-red-600').all();
          for (const err of errors) {
            const text = await err.textContent();
            if (text?.trim()) {
              console.log(`   Error de validación: ${text.trim()}`);
            }
          }
        }

        // Verificar alertas/toasts después de submit
        console.log('\n10. Verificando alertas/toasts...');
        await page.waitForTimeout(1000);
        const alerts = await page.locator('[class*="alert"], [role="alert"], .bg-green-50, .bg-red-50').all();
        for (const alert of alerts) {
          const text = await alert.textContent();
          if (text?.trim()) {
            console.log(`   Alert: "${text.trim().substring(0, 100)}"`);
          }
        }
      }
    } else {
      console.log('   ✗ No se encontró botón de cambiar contraseña');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== Test completado ===');
})();
