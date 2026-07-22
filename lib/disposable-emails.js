/**
 * Disposable / temporary email domain blocklist.
 * Block these domains to ensure only real emails are captured.
 */

const DISPOSABLE_DOMAINS = new Set([
  // Major disposable services
  'tempmail.com','temp-mail.org','tempmailo.com','tempail.com','tempr.email',
  'guerrillamail.com','guerrillamail.net','guerrillamail.org','guerrillamailblock.com','grr.la',
  'mailinator.com','mailinator.net','mailinator2.com','maildrop.cc',
  'yopmail.com','yopmail.fr','yopmail.net','cool.fr.nf','jetable.fr.nf',
  'throwaway.email','throwawaymail.com',
  'sharklasers.com','guerrillamail.info','spam4.me','bccto.me',
  'dispostable.com','disposableemailaddresses.emailmiser.com',
  'mailnesia.com','maildrop.cc','mailnull.com',
  'trashmail.com','trashmail.me','trashmail.net','trashmail.org',
  'fakeinbox.com','fakemail.net','fakemail.fr',
  'getnada.com','nada.email','nada.ltd',
  'mohmal.com','mohmal.im','mohmal.in',
  'harakirimail.com','mailcatch.com','mailexpire.com',
  'tempmailaddress.com','tempinbox.com','tempinbox.co.uk',
  'emailondeck.com','emailfake.com',
  'crazymailing.com','10minutemail.com','10minutemail.net',
  'minutemail.com','20minutemail.com',
  'mailtemp.info','mailtemp.net',
  'spamgourmet.com','spamgourmet.net',
  'incognitomail.com','incognitomail.org',
  'burnermail.io','burnmail.ca',
  'disposeamail.com','disposemail.com',
  'safetymail.info','safeemail.xyz',
  'mytemp.email','mytrashmail.com',
  'wegwerfmail.de','wegwerfmail.net','wegwerfmail.org',
  'mailzilla.com','mailzilla.org',
  'tempmails.net','tempmails.org',
  'tmpmail.net','tmpmail.org',
  'emailtmp.com','mailtmp.com',
  'guerrillamail.de','guerrillamail.biz',
  'emkei.cz','anonymbox.com',
  'getairmail.com','filzmail.com',
  'meltmail.com','spaml.de',
  'trashymail.com','trashymail.net',
  'nobulk.com','nospamfor.us',
  'spamfree24.org','spamhereplease.com',
  'mailnator.com','mailin8r.com',
  'binkmail.com','bobmail.info',
  'chammy.info','devnullmail.com',
  'discard.email','discardmail.com','discardmail.de',
  'dodgeit.com','dodgit.com',
  'e4ward.com','emailigo.de',
  'emailmiser.com','emailsensei.com',
  'emailtemporario.com.br','ephemail.net',
  'fleckens.hu','get2mail.fr',
  'getonemail.com','getonemail.net',
  'girlsundertheinfluence.com','gishpuppy.com',
  'great-host.in','greensloth.com',
  'haltospam.com','hopemail.biz',
  'imails.info','inbucket.com',
  'instantemailaddress.com','ipoo.org',
  'irish2me.com','jetable.com',
  'kasmail.com','koszmail.pl',
  'kurzepost.de','lackmail.net',
  'lhsdv.com','lifebyfood.com',
  'link2mail.net','litedrop.com',
  'lol.ovpn.to','lookugly.com',
  'lopl.co.cc','lortemail.dk',
  'lr78.com','mailbidon.com',
  'mailblocks.com','mailcatch.com',
  'mailchop.com','maileater.com',
  'mailexpire.com','mailforspam.com',
  'mailfree.ga','mailfree.gq',
  'mailfree.ml','mailguard.me',
  'mailhazard.com','mailhazard.us',
  'mailhz.me','mailimate.com',
  'mailinater.com','mailincubator.com',
  'mailismagic.com','mailme.ir',
  'mailme.lv','mailmetrash.com',
  'mailmoat.com','mailms.com',
  'mailquack.com','mailrock.biz',
  'mailscrap.com','mailshell.com',
  'mailsiphon.com','mailslite.com',
  'mailtemp.info','mailtemp.net',
  'mailtothis.com','mailtrash.net',
  'mailzilla.com','mailzilla.org',
  'mbx.cc','mega.zik.dj',
  'meinspamschutz.de','meltmail.com',
  'messagebeamer.de','mezimages.net',
  'ministry-of-silly-walks.de','mintemail.com',
  'mt2015.com','mx0.wwwnew.eu',
  'my10minutemail.com','mypartyclip.de',
  'myphantom.com','mysamp.de',
  'myspaceinc.com','myspaceinc.net',
  'myspacepimpedup.com','mytrashmail.com',
  'neomailbox.com','nepwk.com',
  'nervmich.net','nervtansen.de',
  'netmails.com','netmails.net',
  'neverbox.com','no-spam.ws',
  'noblepioneer.com','nomail.xl.cx',
  'nomail2me.com','nomorespamemails.com',
  'nothingtoseehere.ca','nowmymail.com',
  'nurfuerspam.de','nus.edu.sg',
  'nwldx.com','objectmail.com',
  'obobbo.com','onewaymail.com',
  'oopi.org','ordinaryamerican.net',
  'owlpic.com','pjjkp.com',
  'plexolan.de','pookmail.com',
  'privacy.net','proxymail.eu',
  'prtnx.com','putthisinyourspamdatabase.com',
  'qq.com','quickinbox.com',
  'rcpt.at','reallymymail.com',
  'recode.me','recursor.net',
  'reliable-mail.com','rhyta.com',
  'rklips.com','rmqkr.net',
  'royal.net','rppkn.com',
  's0ny.net','safe-mail.net',
  'safersignup.de','safetymail.info',
  'sandelf.de','saynotospams.com',
  'scatmail.com','schafmail.de',
  'selfdestructingmail.com','sendspamhere.com',
  'shiftmail.com','shitmail.me',
  'shortmail.net','sibmail.com',
  'skeefmail.com','slaskpost.se',
  'slipry.net','slopsbox.com',
  'smashmail.de','soodonims.com',
  'spam.la','spam.su',
  'spamavert.com','spambob.com',
  'spambob.net','spambob.org',
  'spambog.com','spambog.de',
  'spambog.ru','spambox.us',
  'spamcannon.com','spamcannon.net',
  'spamcero.com','spamcon.org',
  'spamcorptastic.com','spamcowboy.com',
  'spamcowboy.net','spamcowboy.org',
  'spamday.com','spamex.com',
  'spamfighter.cf','spamfighter.ga',
  'spamfighter.gq','spamfighter.ml',
  'spamfighter.tk','spamfree.eu',
  'spamfree24.com','spamfree24.de',
  'spamfree24.info','spamfree24.net',
  'spamhole.com','spamify.com',
  'spaml.com','spaml.de',
  'spammotel.com','spamobox.com',
  'spamoff.de','spamslicer.com',
  'spamspot.com','spamstack.net',
  'spamthis.co.uk','spamtrap.ro',
  'speed.1s.fr','superrito.com',
  'suremail.info','teleworm.us',
  'thankyou2010.com','thc.st',
  'tittbit.in','tizi.com',
  'tmailinator.com','toiea.com',
  'tradermail.info','trash-amil.com',
  'trash-mail.at','trash-mail.com',
  'trash-mail.de','trash2009.com',
  'trashdevil.com','trashdevil.de',
  'trashemail.de','trashmail.at',
  'trashmailer.com','trashymail.com',
  'turual.com','twinmail.de',
  'tyldd.com','uggsrock.com',
  'upliftnow.com','uplipht.com',
  'venompen.com','veryreallvemail.com',
  'viditag.com','viewcastmedia.com',
  'viewcastmedia.net','viewcastmedia.org',
  'vomoto.com','vpn.st',
  'vsimcard.com','vubby.com',
  'wasteland.rfc822.org','webemail.me',
  'weetnode.info','wegwerfadresse.de',
  'wegwerfemail.com','wegwerfemail.de',
  'wegwerfmail.de','wegwerfmail.info',
  'wegwerfmail.net','wegwerfmail.org',
  'wh4f.org','whatiaas.com',
  'whatpaas.com','whyspam.me',
  'wikidocuslice.com','wilemail.com',
  'willhackforfood.biz','willselfdestruct.com',
  'winemaven.info','wronghead.com',
  'wuzup.net','wuzupmail.net',
  'wwwnew.eu','xagloo.com',
  'xemaps.com','xents.com',
  'xmaily.com','xoxy.net',
  'yep.it','yogamaven.com',
  'yuurok.com','zehnminutenmail.de',
  'zippymail.info','zoaxe.com',
]);

/**
 * Check if an email domain is disposable.
 * @param {string} email
 * @returns {boolean}
 */
export function isDisposableEmail(email) {
  if (!email || !email.includes('@')) return true;
  const domain = email.split('@')[1].toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Validate email format and check it's not disposable.
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required.' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  // Disposable check
  if (isDisposableEmail(trimmed)) {
    return { valid: false, error: 'Please use your real email address. Temporary email services are not supported.' };
  }

  return { valid: true };
}
