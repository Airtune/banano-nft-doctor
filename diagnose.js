const fetch = require('node-fetch');

const validateAssetBlock = (assetBlock, mintBlockHash, expectedBlockHash, expectedAccount, expectedOwner, expectedLocked) => {
  if (assetBlock.error !== undefined) {
    return [{
      type: 'rpc error',
      mint_block_hash: mintBlockHash,
      field: '',
      message: assetBlock.error
    }];
  }
  const errors = [];

  let blockHashErrorMessage = undefined;
  if (typeof assetBlock['block_hash'] !== 'string') {
    blockHashErrorMessage = `expected typeof block_hash to be 'string', got: '${typeof assetBlock['block_hash']}'`;
  } else if (assetBlock['block_hash'] !== expectedBlockHash) {
    blockHashErrorMessage = `expected block_hash '${expectedBlockHash}', got: '${assetBlock['block_hash']}'`;
  }
  if (blockHashErrorMessage !== undefined) {
    errors.push(
      {
        type: 'incorrect data',
        mint_block_hash: mintBlockHash,
        field: 'block_hash',
        message: blockHashErrorMessage
      }
    );
  }

  let accountErrorMessage = undefined;
  if (typeof assetBlock['account'] !== 'string') {
    accountErrorMessage = `expected typeof account to be 'string', got: '${typeof assetBlock['account']}'`;
  } else if (assetBlock['account'] !== expectedAccount) {
    accountErrorMessage = `expected account '${expectedAccount}', got: '${assetBlock['account']}'`;
  }
  if (accountErrorMessage !== undefined) {
    errors.push(
      {
        type: 'incorrect data',
        mint_block_hash: mintBlockHash,
        field: 'account',
        message: accountErrorMessage
      }
    );
  }

  let ownerErrorMessage = undefined;
  if (typeof assetBlock['owner'] !== 'string') {
    ownerErrorMessage = `expected typeof owner to be 'string', got: '${typeof assetBlock['owner']}'`;
  } else if (assetBlock['owner'] !== expectedOwner) {
    ownerErrorMessage = `expected owner '${expectedOwner}', got: '${assetBlock['owner']}'`;
  }
  if (ownerErrorMessage !== undefined) {
    errors.push(
      {
        type: 'incorrect data',
        mint_block_hash: mintBlockHash,
        field: 'owner',
        message: ownerErrorMessage
      }
    );
  }
  

  let lockedErrorMessage;
  if (typeof assetBlock['locked'] !== 'boolean') {
    lockedErrorMessage = `expected typeof locked to be 'boolean', got: '${typeof assetBlock['locked']}'`;
  } else if (assetBlock['locked'] != expectedLocked) {
    let actual = assetBlock['locked'];
    if (typeof assetBlock['locked'] !== 'boolean') {
      actual = `'${actual}'`;
    }
    lockedErrorMessage = `expected locked to be ${expectedLocked}, got: ${actual}`;
  }
  if (lockedErrorMessage !== undefined) {
    errors.push(
      {
        type: "incorrect data",
        mint_block_hash: mintBlockHash,
        field: 'locked',
        message: lockedErrorMessage
      }
    ); 
  }

  return errors;
}

const test = async (name, report, res, fn) => {
  const errors = [];

  try {
    const fnErrors = await fn();
    errors.push(...fnErrors);
    if (errors.length === 0) {
      report[name] = { success: true };
    } else {
      report[name] = { success: false, errors: errors };
    }
    if (res) {
      res.write(`success: ${name}`);
      res.write('<br>');
    }
  } catch (error) {
    if (res) {
      res.write(`err: ${name}`);
      res.write('<br>');
    }
    errors.push(
      {
        type: 'exception',
        message: error.toString()
      }
    );
    report[name] = { success: false, errors: errors }
  }
}

const diagnose = async (baseUrlString, res = undefined) => {
  const report = {};
  const errors = [];
  const baseUrl = new URL(baseUrlString);

  // setup
  const requestAssetChainMintBlockHash = '439F5CB566E957576C2473B7AF6F3D7D17FBF5022685EB70ED825EAC3B84A56A';
  const requestHistoryUrl = new URL(baseUrl);
  requestHistoryUrl.pathname = 'get_asset_chain';
  requestHistoryUrl.searchParams.set('issuer', 'ban_1swapxh34bjstbc8c5tonbncw5nrc6sgk7h71bxtetty3huiqcj6mja9rxjt');
  requestHistoryUrl.searchParams.set('mint_block_hash', requestAssetChainMintBlockHash);
  let requestAssetChainResponse;
  try {
    const response = await fetch(requestHistoryUrl);
    requestAssetChainResponse = await response.json();
  } catch (error) {
    errors.push(
      {
        type: 'exception',
        message: error.toString()
      }
    );
  }

  // tests
  await test("confirms change#mint > send#asset > receive#asset", report, res, async () => {
    const requestUrl = new URL(baseUrl);
    const mintBlockHash = 'F61CCF94D6E5CFE9601C436ACC3976AF876D1DA21909FEB88B629BEDEC4DF1EA';
    const expectedFrontierBlockHash = '201D206790E46B4CB24CA9F0DB370F8F4BA2E905D66E8DE825D36A9D0E775DAB';
    requestUrl.pathname = 'get_asset_frontier';
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response = await fetch(requestUrl);
      const frontier = await response.json();
      const recipient = 'ban_1twos81eoq9s6d1asht5wwz53m9kw7hkuajad1m4u5otgcsb4qstymquhahf';
      const validationErrors = validateAssetBlock(frontier, mintBlockHash, expectedFrontierBlockHash, recipient, recipient, false);
      errors.push(...validationErrors);
      return errors;
    } catch (error) {
      errors.push(
        {
          type: 'exception',
          message: error.toString()
        }
      );
      return errors;
    }
  });

  await test("confirms send#mint > receive#asset", report, res, async () => {
    const errors = [];
    const mintBlockHash = 'EFE6CCFDE4FD56E60F302F22DCF41E736F611124E3F463135FDC31769A68B970';
    const expectedFrontierBlockHash = 'F00B3B6F2F7CD59B7383F3950CF554B22379F79D3AB607D74FDFA91EC55ED0C0';
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response = await fetch(requestUrl);
      const assetBlock = await response.json();
      const recipient = 'ban_1twos81eoq9s6d1asht5wwz53m9kw7hkuajad1m4u5otgcsb4qstymquhahf';
      const validationErrors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, recipient, recipient, false);
      errors.push(...validationErrors);
      return errors;
    } catch (error) {
      errors.push(
        {
          type: 'exception',
          message: error.toString()
        }
      );
      return errors;
    }
  });

  await test("send all NFTs command sends all NFTs", report, res, async () => {
    // mint 1
    // sent with send all assets command, received, send#atomic_swap, receive#atomic_swap
    const mintBlockHash1 = '698625D8B57D695D45D4597EF5EEBC7DC31B9A706CCA1D26EAA72F8063B6E385';
    const expectedFrontierBlockHash1 = '024ACA494596E054C94E86A11C881018F6A0D73B108D1A0D15A66F91ADCEC1D8';
    const expectedAccount1 = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
    const expectedOwner1   = 'ban_3testz6spgm48ax8kcwah6swo59sroqfn94fqsgq368z7ki44ccg8hhrx3x8';
    const expectedLocked1  = true;

    const requestUrl1 = new URL(baseUrl);
    requestUrl1.pathname = 'get_asset_frontier'
    requestUrl1.searchParams.set('issuer', 'ban_1sweep4n54fbbrzaj1cnr7drf4udbf6f66un3zikhwm6f497pk5ftar3tekj');
    requestUrl1.searchParams.set('mint_block_hash', mintBlockHash1);

    // mint 2
    // sent with send all assets command, received, sent back to sendAllIssuer, and then received by sendAllIssuer again.
    const mintBlockHash2 = '56A2251E0C20CE9B81269E1916858FB2FE178543FA2ED05522D66FC74EC6DD8D';
    const expectedFrontierBlockHash2 = 'D29F111B51E113F58A1805379CB880564402B6DC430B59DE4598E5A5ED36AF3A'; // !!! Validate these manually
    const expectedAccount2 = 'ban_1sweep4n54fbbrzaj1cnr7drf4udbf6f66un3zikhwm6f497pk5ftar3tekj';
    const expectedOwner2   = 'ban_1sweep4n54fbbrzaj1cnr7drf4udbf6f66un3zikhwm6f497pk5ftar3tekj';
    const expectedLocked2  = false;

    const requestUrl2 = new URL(requestUrl1);
    requestUrl2.searchParams.set('mint_block_hash', mintBlockHash2);

    // mint 3
    const mintBlockHash3 = 'A8748C3ABC82C1FC18CD2E9A2AB1AA13E5FCC88F71B1BEBF0C44BE7A520AD393';
    const expectedFrontierBlockHash3 = '024ACA494596E054C94E86A11C881018F6A0D73B108D1A0D15A66F91ADCEC1D8';
    const expectedAccount3 = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
    const expectedOwner3   = 'ban_3testz6spgm48ax8kcwah6swo59sroqfn94fqsgq368z7ki44ccg8hhrx3x8';
    const expectedLocked3  = true;

    const requestUrl3 = new URL(requestUrl1);
    requestUrl3.searchParams.set('mint_block_hash', mintBlockHash3);
    
    // mint 4 is used for next test

    // mint 5
    // minted after send all assets command
    const mintBlockHash5 = '95C9F6EE6038C3DBD7450EC3435203FF3C623EEA8673B7E41077D3DBE875325C';
    const expectedFrontierBlockHash5 = mintBlockHash5;
    const expectedAccount5 = 'ban_1sweep4n54fbbrzaj1cnr7drf4udbf6f66un3zikhwm6f497pk5ftar3tekj';
    const expectedOwner5   = 'ban_1sweep4n54fbbrzaj1cnr7drf4udbf6f66un3zikhwm6f497pk5ftar3tekj';
    const expectedLocked5  = false;

    const requestUrl5 = new URL(requestUrl1);
    requestUrl5.searchParams.set('mint_block_hash', mintBlockHash5);

    try {
      const responsePromise1 = fetch(requestUrl1);
      const responsePromise2 = fetch(requestUrl2);
      const responsePromise3 = fetch(requestUrl3);
      const responsePromise5 = fetch(requestUrl5);

      const response1 = await responsePromise1;
      const response2 = await responsePromise2;
      const response3 = await responsePromise3;
      const response5 = await responsePromise5;

      const assetBlock1 = await response1.json();
      const assetBlock2 = await response2.json();
      const assetBlock3 = await response3.json();
      const assetBlock5 = await response5.json();

      const errors1 = validateAssetBlock(assetBlock1, mintBlockHash1, expectedFrontierBlockHash1, expectedAccount1, expectedOwner1, expectedLocked1);
      const errors2 = validateAssetBlock(assetBlock2, mintBlockHash2, expectedFrontierBlockHash2, expectedAccount2, expectedOwner2, expectedLocked2);
      const errors3 = validateAssetBlock(assetBlock3, mintBlockHash3, expectedFrontierBlockHash3, expectedAccount3, expectedOwner3, expectedLocked3);
      const errors5 = validateAssetBlock(assetBlock5, mintBlockHash5, expectedFrontierBlockHash5, expectedAccount5, expectedOwner5, expectedLocked5);
      
      return [
        ...errors1,
        ...errors2,
        ...errors3,
        ...errors5
      ];
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("doesn't transfer ownership while send#atomic_swap and receive#atomic swap is confirmed but send#payment or #abort_payment isn't submitted on-chain", report, res, async () => {
    const mintBlockHash = '9DBA255E5D311A5D519CF3B3D182E7120D8A94BCF450FFFB7C44FF9569B41CCF';
    const expectedFrontierBlockHash = '024ACA494596E054C94E86A11C881018F6A0D73B108D1A0D15A66F91ADCEC1D8';
    const expectedAccount = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
    const expectedOwner = 'ban_3testz6spgm48ax8kcwah6swo59sroqfn94fqsgq368z7ki44ccg8hhrx3x8';
    const expectedLocked = true;

    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1sweep4n54fbbrzaj1cnr7drf4udbf6f66un3zikhwm6f497pk5ftar3tekj');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response = await fetch(requestUrl);
      const assetBlock = await response.json();
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });
  

  await test("unreceived change#mint, send#asset is owned by recipient but not sendable", report, res, async () => {
    const mintBlockHash = '88A047DA0CF8A07568D8E3BEC6030587988A11581906CBBF372DE32385F35F16';
    const expectedFrontierBlockHash = '8B3CC30A16A578DAD88BF455B7646E99CAC5F2D51FC5615DD38C98E64A6F8F37';
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_1twos81eoq9s6d1asht5wwz53m9kw7hkuajad1m4u5otgcsb4qstymquhahf';
      const expectedOwner   = expectedAccount;
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("unreceived send#mint is owned by recipient but not sendable", report, res, async () => {
    const mintBlockHash = 'D051A922C775616CADC97EB29FD6D75AA514D05ABA4A1252F8B626C9C4F863E8';
    const expectedFrontierBlockHash = 'D051A922C775616CADC97EB29FD6D75AA514D05ABA4A1252F8B626C9C4F863E8'; // !!! Validate manually
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_1twos81eoq9s6d1asht5wwz53m9kw7hkuajad1m4u5otgcsb4qstymquhahf';
      const expectedOwner   = 'ban_1twos81eoq9s6d1asht5wwz53m9kw7hkuajad1m4u5otgcsb4qstymquhahf';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("is unable to send assets owned by someone else", report, res, async () => {
    const mintBlockHash             = '777B8264AFDF004C77285CBBA7F208D2BB5A64118FBB5DCCA7D2619374CB3C4A';
    const expectedFrontierBlockHash = '777B8264AFDF004C77285CBBA7F208D2BB5A64118FBB5DCCA7D2619374CB3C4A'; // !!! Validate manually
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm';
      const expectedOwner   = 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm';
      const expectedLocked  = false;
      // TODO: Add asset-crawler.spec.ts:152:162
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("ignores send#asset block for asset you have already sent with a send#mint block", report, res, async () => {
    const mintBlockHash             = '6F7ED78C5A40145EDCA76B63B1F525DC38A6A4597D59274FBEEED32619C8AF43';
    const expectedFrontierBlockHash = '6F7ED78C5A40145EDCA76B63B1F525DC38A6A4597D59274FBEEED32619C8AF43'; // mint block hash due to not being received
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_1twos81eoq9s6d1asht5wwz53m9kw7hkuajad1m4u5otgcsb4qstymquhahf';
      const expectedOwner   = 'ban_1twos81eoq9s6d1asht5wwz53m9kw7hkuajad1m4u5otgcsb4qstymquhahf';
      const notExpectedOwner = 'ban_1oozinhbrw7nrjfmtq1roybi8t7q7jywwne4pjto7oy78injdmn4n3a5w5br'; // !!!
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("traces chain of sends", report, res, async () => {
    const mintBlockHash             = '87F0D105A36BA43C87AF399B84B8BBF8EED0BDD71279AACC33496809D5E28B66';
    const expectedFrontierBlockHash = 'FB61B5787732E7C92945545B1D926BC6C04A4A5349ADE86A38AD65CF09D4B955'; // !!! receive#asset
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_1oozinhbrw7nrjfmtq1roybi8t7q7jywwne4pjto7oy78injdmn4n3a5w5br';
      const expectedOwner   = 'ban_1oozinhbrw7nrjfmtq1roybi8t7q7jywwne4pjto7oy78injdmn4n3a5w5br';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("ignores send#asset before receive#asset and after previously confirmed send#asset", report, res, async () => {
    const mintBlockHash = '68EB50EF45651590ECC6136D20BBC8D68ECF0C352FC50DBFEC00C3DB3F5F934D';
    const expectedAssetBlockHash = '31C4279ACE505BFACE38BBE4883B1D928C7742BE0C042FF92C8D69C6C8D4B1E1'; // !!! receive#asset
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_at_height'; // !!!!
    requestUrl.searchParams.set('issuer', 'ban_1ty5s13h9tg9f57gwsto8njkzejfu9tjasc8a9mn1wujfxib8dj7w54jg3qm');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);
    requestUrl.searchParams.set('height', 2);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_3testz6spgm48ax8kcwah6swo59sroqfn94fqsgq368z7ki44ccg8hhrx3x8';
      const expectedOwner   = 'ban_3testz6spgm48ax8kcwah6swo59sroqfn94fqsgq368z7ki44ccg8hhrx3x8';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedAssetBlockHash, expectedAccount, expectedOwner, expectedLocked);
      // !!! asset-crawler.spec.ts:214:226
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("confirms completed valid atomic swap", report, res, async () => {
    const mintBlockHash = '01C876EE1CB115E166BF96FB1218EE0107CF07B6F9FD62ED02A40062360DF20A';
    const expectedFrontierBlockHash = 'E8285EBCF17C5FD0DFDCE086253A72D4795032FB5E23F8D13880954D8BB8AE56';
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_1swapxh34bjstbc8c5tonbncw5nrc6sgk7h71bxtetty3huiqcj6mja9rxjt');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_1buyayd6csb1rwprgcks9sif66hthrbu9jah5ehspmsxghi63ter8f66cy1p';
      const expectedOwner   = 'ban_1buyayd6csb1rwprgcks9sif66hthrbu9jah5ehspmsxghi63ter8f66cy1p';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("ignores invalid send#atomic_swap where encoded receive height is less than 2", report, res, async () => {
    try {
      if (requestAssetChainResponse['asset_chain'].length === 3) {
        return [];
      } else {
        return [{
          type: 'incorrect data',
          field: 'asset_chain.length',
          mint_block_hash: requestAssetChainMintBlockHash,
          message: `Expected NFT with mint block hash: ${requestAssetChainMintBlockHash} to have an asset chain length of 3, got: ${requestAssetChainResponse['asset_chain'].length}. Atomic swap blocks with receive height set to less than two should be ignored.`
        }];
      }
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("ignores invalid send#atomic_swap where exact raw amount sent isn't exactly 1 raw", report, res, async () => {
    const mintBlockHash1             = '3B8A04CC4D4219265AF0A5AC71B2340B025A58270FF3845F680FA95ABE1F58EE';
    const expectedFrontierBlockHash1 = '3B8A04CC4D4219265AF0A5AC71B2340B025A58270FF3845F680FA95ABE1F58EE'; // never was a valid send#atomic_swap
    const requestUrl1 = new URL(baseUrl);
    requestUrl1.pathname = 'get_asset_frontier'
    requestUrl1.searchParams.set('issuer', 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd');
    requestUrl1.searchParams.set('mint_block_hash', mintBlockHash1);

    const mintBlockHash2             = 'F08725F34398942CADE0BD9F151CFB71ECFCDC408B3D73A2072373CBF153D695';
    const expectedFrontierBlockHash2 = 'F08725F34398942CADE0BD9F151CFB71ECFCDC408B3D73A2072373CBF153D695'; // never was a valid send#atomic_swap
    const requestUrl2 = new URL(baseUrl);
    requestUrl2.pathname = 'get_asset_frontier'
    requestUrl2.searchParams.set('issuer', 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd');
    requestUrl2.searchParams.set('mint_block_hash', mintBlockHash2);

    const errors = [];

    try {
      const response        = await fetch(requestUrl1);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedOwner   = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedLocked  = false;
      errors.push(...validateAssetBlock(assetBlock, mintBlockHash1, expectedFrontierBlockHash1, expectedAccount, expectedOwner, expectedLocked));
    } catch (error) {
      errors.push({
        type: 'exception',
        message: error.toString()
      });
    }

    try {
      const response        = await fetch(requestUrl2);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedOwner   = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedLocked  = false;
      errors.push(...validateAssetBlock(assetBlock, mintBlockHash2, expectedFrontierBlockHash2, expectedAccount, expectedOwner, expectedLocked));
    } catch (error) {
      errors.push({
        type: 'exception',
        message: error.toString()
      });
    }

    return errors;
  });

  await test("cancels atomic swap if paying account balance is less than min raw in block at: receive height - 1", report, res, async () => {
    try {
      const lastindex = requestAssetChainResponse['asset_chain'].length - 1;
      const frontier  = requestAssetChainResponse['asset_chain'][lastindex];

      const expectedFrontierBlockHash = 'F8BD752EDB490FC4B505ED878981240A79DB5C0490F7242388EF5E183E17EF29';
      const expectedAccount = 'ban_1swapxh34bjstbc8c5tonbncw5nrc6sgk7h71bxtetty3huiqcj6mja9rxjt';
      const expectedOwner   = 'ban_1swapxh34bjstbc8c5tonbncw5nrc6sgk7h71bxtetty3huiqcj6mja9rxjt';
      const expectedLocked  = false;
      const errors = validateAssetBlock(frontier, requestAssetChainMintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("cancels atomic swap if receive#atomic_swap block has a different representative than previous block", report, res, async () => {
    try {
      const mintBlockHash = '09ABEBF530CD96A30FA4F58B458AB7378DF6432CFC39040F6224195A006D65BA';
      // The receive block that changes representative and is expected to be invalid is:
      // CCBBB68F1C216C45F76C175BB2116F97080512C84D0A4830E0186DADFEF56921
      const expectedFrontierBlockHash = '2EEFFD2621E2260255F200131B3CAF3D25271076DB5E8AE856DCE8BBB2DC1875';
      const requestUrl = new URL(baseUrl);
      requestUrl.pathname = 'get_asset_frontier'
      requestUrl.searchParams.set('issuer', 'ban_1swapxh34bjstbc8c5tonbncw5nrc6sgk7h71bxtetty3huiqcj6mja9rxjt');
      requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_1swapxh34bjstbc8c5tonbncw5nrc6sgk7h71bxtetty3huiqcj6mja9rxjt';
      const expectedOwner   = 'ban_1swapxh34bjstbc8c5tonbncw5nrc6sgk7h71bxtetty3huiqcj6mja9rxjt';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("cancels atomic swap if a block other than the relevant receive#atomic_swap is confirmed at receive_height", report, res, async () => {
    try {
      const mintBlockHash = '050D2C75CE68241CF5E3CD180411A73A75A1781D5B2D5BAA26059A06811689A7';
      const expectedFrontierBlockHash = 'B6B01C3701CFE5C091FB6DC068075D7A567926C74C44B1BC6F0FAE3BD18A0F6B';
      const requestUrl = new URL(baseUrl);
      requestUrl.pathname = 'get_asset_frontier'
      requestUrl.searchParams.set('issuer', 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd');
      requestUrl.searchParams.set('mint_block_hash', mintBlockHash);
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedOwner   = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("cancels atomic swap if a block other than send#payment follows receive#atomic_swap", report, res, async () => {
    try {
      const mintBlockHash             = 'AE29A6AE92A3F78A49D6F1A82C014276FE95140963FCED2410A640A5173A1FC8';
      const expectedFrontierBlockHash = '292A27AC9930DFAA00356AF1B78960A2FF785ABDD8999C2FB3D0F20C99A822A0';
      const requestUrl = new URL(baseUrl);
      requestUrl.pathname = 'get_asset_frontier'
      requestUrl.searchParams.set('issuer', 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd');
      requestUrl.searchParams.set('mint_block_hash', mintBlockHash);
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedOwner   = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("cancels atomic swap if send#payment sends too little raw to the right account", report, res, async () => {
    try {
      const mintBlockHash             = 'B0BB1D5000D4A9E51993968C25A27804FC5551CFB18656B9FD7444D70C496A11';
      const expectedFrontierBlockHash = '1ACDBFDF725D5738CD6B6454464FA1313574C056626ECEFCA8C4B5D564F75338';
      const requestUrl = new URL(baseUrl);
      requestUrl.pathname = 'get_asset_frontier'
      requestUrl.searchParams.set('issuer', 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd');
      requestUrl.searchParams.set('mint_block_hash', mintBlockHash);
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedOwner   = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });

  await test("cancels atomic swap if send#payment sends enough raw to the wrong account", report, res, async () => {
    const mintBlockHash = '32A3470B9217D796E16D2CE2445A5FC84F023695B099D2AE6B4B3133FF313CA6';
    const expectedFrontierBlockHash = 'A5FE789EF4C2E52EEFB31F3356581317FF5D1C8F9DEACDC4AE85EE8AB5D3E56A'; // !!! Manually validate
    const requestUrl = new URL(baseUrl);
    requestUrl.pathname = 'get_asset_frontier'
    requestUrl.searchParams.set('issuer', 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd');
    requestUrl.searchParams.set('mint_block_hash', mintBlockHash);

    try {
      const response        = await fetch(requestUrl);
      const assetBlock      = await response.json();
      const expectedAccount = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedOwner   = 'ban_3cantszxkej3kzcjjpxcu35jcn6ck884uu3q8ypd3xc1e1y61tt6jj7p99yd';
      const expectedLocked  = false;
      const errors = validateAssetBlock(assetBlock, mintBlockHash, expectedFrontierBlockHash, expectedAccount, expectedOwner, expectedLocked);
      return errors;
    } catch (error) {
      return [{
        type: 'exception',
        message: error.toString()
      }];
    }
  });
  
  return report;
};

module.exports = diagnose;
