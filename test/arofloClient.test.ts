const {
  DEFAULT_PLACEHOLDER_CLIENT_NAME,
  assertAroFloSuccess,
  buildClientNoteXml,
  buildClientXml,
  buildSignedHeaders,
  buildVarString,
  clientNameSearchEntries,
  contactPhoneSearchEntries,
  mapClient,
  mapContact,
} = require('../src/connectors/arofloClient');

describe('AroFlo client helpers', () => {
  it('builds AroFlo query strings with repeated where clauses', () => {
    expect(buildVarString(contactPhoneSearchEntries('+61 400 000 000'))).toBe(
      'zone=contacts&where=and%7Carchived%7C%3D%7Cfalse&where=and%7C(%7Cphone%7C%3D%7C%2B61%20400%20000%20000&where=or%7Cmobile%7C%3D%7C%2B61%20400%20000%20000%7C)&page=1&pageSize=20'
    );
  });


  it('builds AroFlo client search query strings', () => {
    expect(buildVarString(clientNameSearchEntries(DEFAULT_PLACEHOLDER_CLIENT_NAME))).toBe(
      'zone=clients&where=and%7Carchived%7C%3D%7Cfalse&where=and%7Cclientname%7C%3D%7CRingCentral%20App%20Connect%20Placeholder%20Client&page=1&pageSize=20'
    );
  });

  it('maps AroFlo client records', () => {
    expect(mapClient({
      clientid: 'client-1',
      clientname: 'RingCentral App Connect Placeholder Client',
      phone: '+61 400 000 000',
      email: 'placeholder@example.com',
    })).toMatchObject({
      id: 'client-1',
      clientId: 'client-1',
      name: 'RingCentral App Connect Placeholder Client',
      phone: '+61 400 000 000',
      email: 'placeholder@example.com',
    });
  });

  it('builds ClientNote update XML with AroFlo noteid field', () => {
    const xml = buildClientNoteXml({
      clientId: 'client-1',
      clientNoteId: 'note-1',
      content: 'Updated note',
      filter: 'Internal Only',
      sticky: false,
    });

    expect(xml).toContain('<noteid>note-1</noteid>');
    expect(xml).not.toContain('clientnoteid');
    expect(xml).toContain('<clientid>client-1</clientid>');
    expect(xml).toContain('<content><![CDATA[Updated note]]></content>');
  });
  it('builds placeholder Client XML with required dummy fields', () => {
    const xml = buildClientXml({ name: DEFAULT_PLACEHOLDER_CLIENT_NAME, orgId: 'org-1' });

    expect(xml).toContain('<clientname><![CDATA[RingCentral App Connect Placeholder Client]]></clientname>');
    expect(xml).toContain('<firstname><![CDATA[RingCentral]]></firstname>');
    expect(xml).toContain('<surname><![CDATA[App Connect]]></surname>');
    expect(xml).toContain('<shortname><![CDATA[RC App Connect]]></shortname>');
    expect(xml).toContain('<phone><![CDATA[0000000000]]></phone>');
    expect(xml).toContain('<orgs><org><orgid>org-1</orgid></org></orgs>');
    expect(xml).toContain('<address><addressline1><![CDATA[Created by RingCentral App Connect]]></addressline1>');
    expect(xml).toContain('<mailingaddress><addressline1><![CDATA[Created by RingCentral App Connect]]></addressline1>');
    expect(xml).toContain('<postcode><![CDATA[3000]]></postcode>');
  });

  it('throws when AroFlo returns nested postxml errors', () => {
    expect(() => assertAroFloSuccess({
      status: '0',
      statusmessage: 'Login OK',
      zoneresponse: {
        postresults: {
          errors: [
            {
              code: '106',
              message: 'Data Supplied in XML is invalid',
              detail: 'All Required fields need to be supplied',
            },
          ],
        },
      },
    })).toThrow('AroFlo API returned postxml errors: code 106: Data Supplied in XML is invalid: All Required fields need to be supplied');
  });
  it('signs AroFlo requests with the documented HMAC payload order', () => {
    const signed = buildSignedHeaders({
      credentials: {
        secretKey: 'secret',
        uEncoded: 'user+encoded',
        pEncoded: 'pass/encoded',
        orgEncoded: 'org=encoded',
        accept: 'text/json',
      },
      method: 'GET',
      varString: 'zone=contacts&where=and%7Carchived%7C%3D%7Cfalse',
      timestamp: '2026-01-02T03:04:05.000Z',
    });

    expect(signed.payload).toBe('GET++text/json+uencoded=user%2Bencoded&pencoded=pass%2Fencoded&orgEncoded=org%3Dencoded+2026-01-02T03:04:05.000Z+zone=contacts&where=and%7Carchived%7C%3D%7Cfalse');
    expect(signed.signature).toBe('d60ebd65a9281c5b4f6ae9a1c665302a9850aef96c4906b43473197ff156a5156b864fa8fbdfee89368f29af028ccdec71991071abdcb09cb5982f8fa5107c57');
    expect(signed.headers.Authentication).toBe(`HMAC ${signed.signature}`);
  });

  it('maps AroFlo contact records into App Connect contact info', () => {
    expect(mapContact({
      contactid: 'contact-1',
      clientid: 'client-1',
      givennames: 'Ava',
      surname: 'Flo',
      mobile: '+61 400 000 000',
      email: 'ava@example.com',
    })).toMatchObject({
      id: 'contact-1',
      contactId: 'contact-1',
      clientId: 'client-1',
      name: 'Ava Flo',
      type: 'Contact',
      phone: '+61 400 000 000',
      additionalInfo: {
        clientId: 'client-1',
        email: 'ava@example.com',
      },
    });
  });
  it('maps AroFlo Contacts-zone org fields into contact and client IDs', () => {
    expect(mapContact({
      userid: 'user-1',
      givennames: 'Test',
      surname: 'RCLabs',
      phone: '+17206789819',
      email2: 'secondary@example.com',
      org: {
        orgid: 'client-1',
        orgname: 'RingCentral App Connect Placeholder Client',
      },
    })).toMatchObject({
      id: 'user-1',
      contactId: 'user-1',
      clientId: 'client-1',
      name: 'Test RCLabs',
      phone: '+17206789819',
      additionalInfo: {
        contactId: 'user-1',
        clientId: 'client-1',
        clientName: 'RingCentral App Connect Placeholder Client',
        email: 'secondary@example.com',
      },
    });
  });
});
