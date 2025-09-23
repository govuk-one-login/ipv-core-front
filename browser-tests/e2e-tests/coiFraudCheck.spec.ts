import { test, expect, Page } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('COI Fraud Check - Given Name Change', () => {
  
  test('should pass successfully for a given name change and show reuse screen', async ({ page, request }) => {
    const orchestratorStubUrl = 'https://orchstub:348tuj!hsDd@orch.stubs.account.gov.uk/';
    const ticfManagementApiUrl = 'https://ticf.stubs.account.gov.uk/management/user';
    const ticfApiKey = 'cDM2Qi3IrS5MC5f4W5ZmxNMxYvwJj2b4BGI4xCc4';

    let userId: string;

    await test.step('Navigate to Orchestrator Stub and start journey', async () => {
      await page.goto(orchestratorStubUrl);
      await page.getByRole('button', { name: 'Full journey route' }).click();
    });
    
    await test.step('Enable Feature Flags', async () => {
      await page.goto('https://identity.build.account.gov.uk/ipv/usefeatureset?featureSet=ticfCriBeta,disableStrategicApp');
      await page.goBack();
      await page.goBack();
    });

    await test.step('Configure and Post to TICF Management API', async () => {
      userId = await page.getByRole('textbox', { name: 'Enter userId manually' }).inputValue();
      expect(userId).toBeTruthy();

      const apiRequestPayload = {
        evidence: {
          type: "RiskAssessment",
          txn: randomUUID(),
          ci: null,
        },
        responseDelay: 0,
      };

      const response = await request.post(`${ticfManagementApiUrl}/${userId}`, {
        headers: {
          'x-api-key': ticfApiKey,
          'Content-Type': 'application/json',
        },
        data: apiRequestPayload,
      });

      expect(response.ok(), 'TICF API call failed').toBeTruthy();
      const responseBody = await response.json();
      expect(responseBody.message).toBe('Success!!');
    });

    //Initial P2 journey

    await test.step('Complete initial P2 identity journey', async () => {
        await page.getByRole('button', { name: 'Full journey route' }).click();
        await page.getByRole('radio', { name: 'UK, Channel Islands or Isle' }).check();
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.getByRole('radio', { name: 'Yes' }).check();
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.locator('#test_data').click();
        await page.locator('#test_data').selectOption('Alice Parker (Valid) DVLA Licence');
        await expect(page.locator('#test_data')).toHaveValue('Alice Parker (Valid) DVLA Licence');
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).click();
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).fill('3');
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).click();
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).fill('2');
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).click();
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).fill('1');
        await page.getByRole('spinbutton', { name: 'Biometric Verification' }).click();
        await page.getByRole('spinbutton', { name: 'Biometric Verification' }).fill('3');
        await page.getByRole('button', { name: 'Submit data and generate auth' }).click();
        
        //await page.goto('https://driving-licence-cri.stubs.account.gov.uk/authorize?client_id=ipv-core-build&request=eyJraWQiOiJkcml2aW5nLWxpY2VuY2UtY3JpLXN0dWJzLWJ1aWxkLUlOcUhCdk1ZV21Ob2RrbHZicFRDZ2YxRFMxMEZ2NWljNF84TGRvQk5qQXciLCJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.k6qNeJuDAYxwEmmIQFdagYwUSMCQbXuHuHkhDBKSMKwKoAakr_tAsX_verWFeS96y-W8BbrJqgxIqWsBxY5uvZY5RX8Krk7hx4vEoW244eQ2uGYmaLwu-xrO97Ds-k0s7sd8kLkuzu1J6sn7c3bIDvEy5jwUF7hZhJZfumjqGPXgAtYOFkfOZK9ooWtnN2A_5MB6UktxNDMaL_iwA-ObGKfdXewQCN7beLMZVCNcgFvh1LDc7feCNSUfzT4umZXhwkjCZZ-Ys9_8D9r9i9WMSytx4CcTL6ykKOdf7JwyUHlfD-eZqbTbvX2sIohULe-amgFXUCmGILQmkrKLAPHWMg.LrMCrjbAKKhH6XDn.SZCoVLRY5_DOzdfhOfgb4HAgSw9T-yYqHVWq0xDABPM2QRibsW13BSGhLG1duXiuE_JCx7yC1vmn1n9HOxyHCSWMEqeDRCR8w_ZbUb__ghMIW2gq9rmbz7y294886nMkLXV7yShnBwH3p5k-MM6gFPZyd9nigstQ2T6nnNSZJCo_rebVfqu8kb0NrnEMmSxwuJnv2M8aBFt_X4eTQoQjSQaWNljyb4PC-vQgOGg_F8HI2vHMw_Q-6cAXB-ThJjjBvEQUU0SDGSl_21gMZyG05bX3ubn1KRwUpuSmFsr7PaD9lDului4XZvdPUnaQAEDFeA1u2QleaXsZ-EszfzV0gxNtunlmaz3-wvV7eIyFnIJsuJXNMcTQVloEkAtm8UFqpXnPfueCVLIpaSCkIUqNqLJVOjKNTBAP0GmaKuJf_UXV3m0YJmACYbEXzBThb1-JUPUUbF007dxpuRLaY3w6uy0kKD35OQLxJ4GONX-CvzhyJDZKmqiT_u1ML2WiOJzZYFubeGUiqKT0xbmOG7t5OhyTnqebbr3FmviIR2kKIxW5--pqousBfsoZpK9aTJWNIwMnQspmcXa2rKndZ7YoNgBvm0wko2-T5AokGAR5ZWG83yg8QUYKqXyzmviPJCiFDPooIJSlTHtYXeOEau9x19SPSmrxYtByxTdiC6zIMvpYGa6WpBJ6arHgIATRdnBIA1R7xzH7XB4rJHlu1L3SNJF06WMKgbglee0U9XdW0WiwuKiNtrkwlsYgljYXrzU5s_cruBHrRj3jZd8r5rPdyfP3LPfOzvdcU275GB6AEaLTCPCuOE3v1raZOUwT2KOB8AiSv-0VXPyfeZazg5RT5gRccz7Pxx72qe2RW6XoIEna698ScFGmijU9wWWLb8aOKZkCZ8KVDuA0U-oyTpaFIqQBrIXCvbUdjDRP-pSxjByMNNK3j8B_L1TqVyF3yR5R_oT8cfv_OzYEvBalj0dnmDrf8W0q4MJWk2ZKkCL8gCcom_rD21-MjwkJpQsZtjWPp1U-Eba_9TEUgxuV0YY6IEhKSSm2uTJatkGDXUasIXt3gTUGT9-yVKHKLd-PC1sKQkckWNX-9CQu3K31OPfyw1uKGmOQyu4kkFCecKhLS9cuPDibwl97yAC6o2zKtYPbGg5hSugVpO6dTYpJtvfsMr31hKZ6WLy3d-Qf95q5AG81aVdoi76YTc2RJw3p7J__vSRQ-Ji4zehbY4L6lu8y-j4RtWgWijNcmVvAIirdfGzgQcpksLi5IDerL_oB8Iy9w7FVyL8EPgjudVMRvAioEgZgo7b0OervKOhEVnROIjuejtAxlKcEH9qUQSoBPE7x5g9mwkLLxiSrt3uWq8LMKLXHjKGk-bV-gjTGdHfGV4p2YfweKvsSdI4fZx0mdn8hRo2XxvZ9_xY5sMqsN05-J-3SxM1CH81vQROHvIxP11sRhxLKKigNnUKSmK_mUVpAaMGxUD7-JF9hdnS5ak4Czql0uJLDdv7jfMfqwPsq-hSUNBZ4BJ2wDSUUgietY-S90dDrPpynrU3L9oB_Ya15hezehzAG4l3bLUvGywId4PxpMDQSKZ64Tedxe4blWs-98lnQX40ktkZZAqvpziI05SbAAhHQ0gtcY-kOof10RhtsfrAdpcQ25JYdaImx-a--pbuUWbjvapV3qKWlKaP3Jsn2BYTMjXobFPSHMLcGKFBawIBDsm5g3hluA97Mc7eGDEvwBHN1WydkC9SMhFCFgGxxB55jb-18uQfrFiTXV0iTx9HRTC39O8FqYnu2COiaSICEHOS4kSeZfuOyXmuGqJcD.uMtrR4Is1_uUhAQ1OORqXw');
        await expect(page.getByRole('heading', { name: 'Driving Licence (Stub)' })).toBeVisible();
        await page.locator('#test_data').selectOption('Alice Parker (Valid) DVLA Licence');      
        await expect(page.locator('#test_data')).toHaveValue('Alice Parker (Valid) DVLA Licence');
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).click();
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).fill('3');
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).click();
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).fill('2');
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).click();
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).fill('1');
        await page.getByRole('button', { name: 'Submit data and generate auth' }).click();
        
        await page.goto('https://identity.build.account.gov.uk/ipv/page/page-dcmaw-success');
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.locator('#test_data').selectOption('Alice Parker Valid Address');
        await page.getByRole('button', { name: 'Submit data and generate auth' }).click();
        await page.locator('#test_data').selectOption('Alice Parker (Valid) Fraud');
        await expect(page.locator('#test_data')).toHaveValue('Alice Parker (Valid) Fraud');
        await page.getByRole('spinbutton', { name: 'Fraud' }).click();
        await page.getByRole('spinbutton', { name: 'Fraud' }).fill('2');
        await page.getByRole('spinbutton', { name: 'Activity' }).click();
        await page.getByRole('spinbutton', { name: 'Activity' }).fill('1');
        await page.getByRole('checkbox', { name: 'Override VC Not Before (nbf)' }).check();
        await page.getByRole('button', { name: 'Submit data and generate auth' }).click();
        
        await page.goto('https://identity.build.account.gov.uk/ipv/page/page-ipv-success');
        await expect(page.getByRole('heading', { name: 'Continue to the service you need to use' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Continue to the service' })).toBeEnabled();
        await page.getByRole('button', { name: 'Continue to the service' }).click();
        
        //await page.goto('https://orch.stubs.account.gov.uk/callback?code=3tS1XKO0OAsfvlXRLbZUk9k1gQIXVRXGE-JOOi4DRzg&state=orchestrator-stub-state');
        await expect(page.getByText('Raw User Info Object')).toBeVisible();
    });

    //reuse and name change journey
    await test.step('Start reuse journey for name change', async () => {
        await page.goto(orchestratorStubUrl);
        await page.getByRole('textbox', { name: 'Enter userId manually' }).fill(userId);
        await page.getByRole('button', { name: 'Full journey route' }).click();

        await page.goto('https://identity.build.account.gov.uk/ipv/page/confirm-your-details');
        await page.getByRole('radio', { name: 'No - I need to update my' }).check();
        await page.getByRole('checkbox', { name: 'Given names' }).check();
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.getByRole('radio', { name: 'Update your name using the' }).check();
        await page.getByRole('button', { name: 'Continue' }).click();

        await page.locator('#test_data').selectOption('Alice Parker (Changed First Name) DVLA Licence');
        await expect(page.locator('#test_data')).toHaveValue('Alice Parker (Changed First Name) DVLA Licence');
        //gpg45 evidence
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).click();
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).fill('3');
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).click();
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).fill('2');
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).click();
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).fill('1');
        await page.getByRole('spinbutton', { name: 'Biometric Verification' }).click();
        await page.getByRole('spinbutton', { name: 'Biometric Verification' }).fill('3');
        await page.getByRole('button', { name: 'Submit data and generate auth' }).click();

        //driving licence stub
        //await page.goto('https://driving-licence-cri.stubs.account.gov.uk/authorize?client_id=ipv-core-build&request=eyJraWQiOiJkcml2aW5nLWxpY2VuY2UtY3JpLXN0dWJzLWJ1aWxkLUlOcUhCdk1ZV21Ob2RrbHZicFRDZ2YxRFMxMEZ2NWljNF84TGRvQk5qQXciLCJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.l6-915hrfSHbkIA9qPwmsBawhRUtBj8GkVeTaKI_0KUp_KsNL0C5xMX7GhDB9TvStzMVDleYWIj5NPhOSNnJo1vDAzyXC7EJOT1lq0rO-VfX2nY5iQf6nSyU95Bc6r2pKyHmEgZZX5SHj7qnTB-NNVqjYUqUbQw4N2H5dSsMBHjmpCT9POQ5yHd5FlwQUQLhRdqbuMoid3bIwx_iunaehPbuqb0WZ6m07EfYuasO9mN9B32FgNn2NQM6ncJX2DpWj8yeZPaToa6JyFGnSdhP406HMqf12WDmk8jYGD-CLsOjSZwGZdun_u7ypPLOPTGZhfbSPVUUiX3OZlNvSxhtog.uoRCRK75pTf-tz3J.QKTJyXMp9DN9ghaWKv1JUHGmRhh3p5nc5PPgwE5V0ugNi8ekfblkMs6PHk5B91j1pFzShk9SL9k0Sa_CIp_zwwNJrWL0n7SwUof_iRnDOkX1BfniACybv8w-lwvtD3k7_UQ3wFv7gPBIrtyhCqpYC74w6xzoDgcOGpPhIUrArjzMfEUacSpDQHOwcCKtselGsfjnUjYXhNjafz9mHlnC73YCUXrCP0sLwxMMTQQCN8OR3WtUD6_cB3OA5DbHKhMhL9koxDYTCoIrmKLDY95_ujyG2z7NwlTaGNiU1cBvW1RWACDM30VgumYcu8M03ldQm1pZYDcVc8M337N6IxB4jBg5LLqAwyPOhEctHf_iUM7-8lNjsX2i1rveswlK1dsLdAhbZW3HqTEMVb0t9Ac3RPWXPocU0u2KpsHl9Er34Ck2bU42wAXnl9nOORovZ5cJ6eB1yP0DTbq2_-djCfG_isBtfUSpbeIzm3uJOsLS11r0T75aI-A54ltKBDrWGjPejmkeg6oFo5d5K5hFUNaFh-yq5ZzTxSLAGHieqrz7GpGTXrEiYuJ352SGnw-OZqVSoqli2G57-JR3ja-t8LPCRKcAK8_iQQK2RbxwtuIGGM-bgqL2RhVyhOyC3Ii8mdC_tcDkKmnVlKZQX3PFwvScqG_H_Bzf9hsNVKLsZoHXdC0Yr9_5S862kqI6YJhPGaHIlaosrmdOQY4qmhBKgMZqkINeuVkceHAkyAAZeez_OhnAaytWtDXcG3cC6tXT9EiuR1uVOifhCbyVsLQ9BwrkBf7MQYg2J7oJO2kB8jTutR78JFFainY4xh_BPuxoQX5Qnnaca4BOI3PtZyKMfjRRbArhDPNKH2-iZ0oX9zl2lZvWGB8HiB0RVKpe_aSdVYdmCQ8OTeaCXqhht5RVWRFuHF0RwMAi1Espkiu_2xFmroC5tYCJ406mRJPX5w57QFBgZuVxNvWKcNqvf7tGWl139K9N7qD26PITy_UrJCyq-T_FIDmyOSWkCvjuR_rfwvUOZGES0mzTHURjCxCR6G7hRqXOQWX1s5iIwZjltruBjT1mAm2nEBP_BFTJ8h7z8NQTZo4KC0iEIJYCg5GnDiY7wVh_sc0c9yhqZj_wOWssZoM4QK1RWeymimyTublOLl4_glsa23ounZJQfbCc4JFECUkQGuoNpV6hT9ZVLW3HAOIgU1KbVZHN_2vgMVcJMNOm6fWQ3XfGpnWXtR-2xhdH4Cq2EejPkwsJPv5OmwQ_qY399VsXn7Ao1Pdc5a8v--WmADWRvb9UceYSQQ1GF3JS_lsk60_4rxeXDbP3OSMsIbffHeksuHya4-FnLw2pvzoFFbQI8i78PO_DO8Q3IF9JmsuMd9IKwPJuzbLg1eXT3D1TLYrFg5ViWCokFaIn4UXRu-TusQzLcW6nGF9u-wiRaPpMDoukggJtEVFngNbtr8NORXcWRfz4BnaU1QhaJs3D10mzmCCb_MMgB_GMyayL8vcuAxvi_PdtGaz5k5GemYEJYc-gHOJrsUlR_J3glp48gEfNpsEHhosBdPO_08O6bMzT7j5GXGW2fQSyM1tG3uPs1u07bybX3rEBfJvrelhX7W7eD3S6MOBNZf-fAcUbpQuChRYJ9vaqd8jcJ3AN5KpvSDSj4HnV8wAYkXvvqzlIOmMRVPNgzuL9g0a1KjoJalVicRsiCdEivy9wQeioN3gh69dTWctQRP9XU9mm50EodGwI6kW754VPjXzRm-g1ArYI7DpOjYKA5sRs-KLvQrZ3iAH2yXnXBTX72sKj6kMHf5fxVmYxS_NIR-iPuFR15re91Y_JRvWhUUY8p2yHjIKEmiqacjvhHc7KcYpSwWjmP9ryMp3umXfrPvQ0NW2rkYONwOdQA-LLP-RkK_tQlP5Mx2zQe-48J3iqU8DnNURjMaraxITBgTtuaVjKmY6v7pKHAo0svVjOHs2S2LieKM2Y60Tgqlh1SjP5wnjimFYryTcQq0rWJ8kldAFQ2kFs-KP_e1_zAFnFL3JSinIhpaGpjTqCkhyR9Jgrqp9CBJEULXXbLp0jDDvZSPdaBDo31sf2Pn9LxMJB6mKbwg.Sn5ly8cpxEb9tVBTNbROUA');
        await expect(page.getByRole('heading', { name: 'Driving Licence (Stub)' })).toBeVisible();
        await page.locator('#test_data').selectOption('Alice Parker (Changed First Name) DVLA Licence');
        await expect(page.locator('#test_data')).toHaveValue('Alice Parker (Changed First Name) DVLA Licence');
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).click();
        await page.getByRole('spinbutton', { name: 'Strength Hours' }).fill('3');
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).click();
        await page.getByRole('spinbutton', { name: 'Validity Minutes' }).fill('2');
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).click();
        await page.getByRole('spinbutton', { name: 'Activity History Seconds' }).fill('1');
        await page.getByRole('button', { name: 'Submit data and generate auth' }).click();
        await page.getByRole('button', { name: 'Continue' }).click();

        //fraud stub
        await page.locator('#test_data').selectOption('Alice Parker (Changed First Name) Fraud');
        await page.getByRole('spinbutton', { name: 'Fraud' }).click();
        await page.getByRole('spinbutton', { name: 'Fraud' }).fill('2');
        await page.getByRole('spinbutton', { name: 'Activity' }).click();
        await page.getByRole('spinbutton', { name: 'Activity' }).fill('1');
        await page.getByRole('button', { name: 'Submit data and generate auth' }).click();

        //IPV Success page
        //await page.goto('https://identity.build.account.gov.uk/ipv/page/page-ipv-success');
        await expect(page.getByRole('heading', { name: 'Continue to the service you' })).toBeVisible();
        await page.getByRole('button', { name: 'Continue to the service' }).click();
        //await page.goto('https://orch.stubs.account.gov.uk/callback?code=y7bzX5oVpwXdeTFXjFqjmB08six8vBkPfuwW4DfHAqA&state=orchestrator-stub-state');
        await expect(page.getByText('Raw User Info Object')).toBeVisible();
        await page.locator('summary').filter({ hasText: 'Raw User Info Object' }).click();
        //check VCs
        await expect(page.getByText('Cri Type: https://address-cri')).toBeVisible();
        await expect(page.getByText('Cri Type: https://dcmaw-cri.')).toBeVisible();
        await expect(page.getByText('Cri Type: https://driving-')).toBeVisible();
        await expect(page.getByText('Cri Type: https://fraud-cri.')).toBeVisible();
        await expect(page.getByText('Cri Type: https://cimit.stubs')).toBeVisible();
        await expect(page.getByText('Cri Type: https://ticf.stubs.')).toBeVisible();
    });

    //reuse after first name change
    await test.step('Verify final reuse screen after name change', async () => {
        await page.goto(orchestratorStubUrl);
        await page.getByRole('textbox', { name: 'Enter userId manually' }).fill(userId);
        await page.getByRole('button', { name: 'Full journey route' }).click();
        //await page.goto('https://identity.build.account.gov.uk/ipv/page/page-ipv-reuse');
        await expect(page.locator('#header')).toContainText('You have already proved your identity');
        await expect(page.getByText('ALISON JANE PARKER')).toBeVisible();
        await expect(page.getByText('80TYEOMAN WAYTROWBRIDGEBA14')).toBeVisible();
        await expect(page.getByText('January 1970')).toBeVisible();
    });
    
  });

  
});