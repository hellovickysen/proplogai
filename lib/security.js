/**
 * Account security utilities — disposable email blocking + password strength
 */

// 200+ disposable/temporary email domains
const DISPOSABLE_DOMAINS = [
  'tempmail.com','temp-mail.org','guerrillamail.com','guerrillamail.net','guerrillamail.org',
  'mailinator.com','maildrop.cc','yopmail.com','yopmail.fr','throwaway.email',
  'sharklasers.com','guerrillamailblock.com','grr.la','dispostable.com','trashmail.com',
  'trashmail.me','trashmail.net','trash-mail.com','mailnesia.com','tempmailaddress.com',
  'tempail.com','tempr.email','discard.email','discardmail.com','fakeinbox.com',
  'mailcatch.com','mailexpire.com','mailmoat.com','mytemp.email','throwawaymail.com',
  'getnada.com','nada.email','emailondeck.com','10minutemail.com','10minutemail.net',
  'minutemail.com','mohmal.com','harakirimail.com','crazymailing.com','mailsac.com',
  'inboxkitten.com','burnermail.io','spamgourmet.com','mailnull.com','spamfree24.org',
  'jetable.org','trashymail.com','trashymail.net','tempomail.fr','tempinbox.com',
  'tempinbox.co.uk','mailtemp.info','mailtemp.net','mailinater.com','mailforspam.com',
  'safetymail.info','filzmail.com','devnullmail.com','letthemeatspam.com','spambox.us',
  'spam4.me','trash2009.com','binkmail.com','bobmail.info','chammy.info',
  'dayrep.com','einrot.com','flurred.com','imstations.com','killmail.com',
  'klzlk.com','koszmail.pl','kurzepost.de','mfsa.ru','mfsa.info',
  'monmail.fr','mvrht.net','nospam.ze.tc','nomail.xl.cx','objectmail.com',
  'proxymail.eu','pjjkp.com','rcpt.at','reallymymail.com','rklips.com',
  'rmqkr.net','rppkn.com','rtrtr.com','s0ny.net','shitmail.me',
  'spaml.de','superrito.com','teleworm.us','topranklist.de','turual.com',
  'vomoto.com','vpn.st','wuzup.net','xagloo.com','zetmail.com',
  'zippymail.info','mailhazard.com','mailhazard.us','mailquack.com','mailseal.de',
  'mailzilla.com','mailzilla.org','sogetthis.com','whatiaas.com','emailable.rocks',
  'emailfake.ml','fakemailgenerator.com','generator.email','inboxbear.com',
  'emailtemporanea.com','emailtemporanea.net','emailtemporar.ro','emailwarden.com',
  'gmailom.co','gmx.us','haltospam.com','incognitomail.com','incognitomail.org',
  'ipoo.org','irish2me.com','iwi.me','jnxjn.com','jobbikszyer.hu',
  'jourrapide.com','kasmail.com','keemail.me','keepmymail.com','kir.ch.tc',
  'klassmaster.com','klassmaster.net','kloap.com','lajoska.pe.hu','link2mail.net',
  'litedrop.com','loh.pp.ua','lovemeleaveme.com','lr78.com','lru.me',
  'lukop.dk','m21.cc','maboard.com','mail-temporaire.fr','mail.mezimages.net',
  'mail2rss.org','mail333.com','mail4trash.com','mailbidon.com','mailblocks.com',
  'mailfs.com','mailguard.me','mailimate.com','mailincubator.com','mailismagic.com',
  'mailme.ir','mailme.lv','mailmetrash.com','mailna.co','mailna.in',
  'mailna.me','mailnator.com','mailnull.com','mailorg.org','mailpick.biz',
  'mailrock.biz','mailscrap.com','mailshell.com','mailsiphon.com','mailslite.com',
  'mailtemporaire.com','mailtemporaire.fr','mailtrash.net','mailtv.net','mailtv.tv',
  'mailzilla.com','makemetheking.com','manifestgenerator.com','mbx.cc','mega.zik.dj',
  'meltmail.com','messagebeamer.de','mezimages.net','mfsa.ru','migmail.pl',
  'migumail.com','ministryofsound.org.uk','mintemail.com','misterpinball.de',
  'mmailinater.com','moakt.co','moakt.ws','mobileninja.co.uk','mohmal.im',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf','mt2015.com','mx0.wwwnew.eu',
  'mycard.net.ua','mycleaninbox.net','myemailboxy.com','mymail-in.net','mypacks.net',
  'mypartyclip.de','myphantom.com','mysamp.de','myspaceinc.com','myspaceinc.net',
  'myspaceinc.org','myspacepimpedup.com','mytempemail.com','mytrashmail.com',
  'neomailbox.com','nepwk.com','nervmich.net','nervtansen.de','netmails.com',
  'netmails.net','neverbox.com','nfast.in','nguyenusername.com','nincsmail.hu',
  'nmail.cf','nobulk.com','noclickemail.com','nodezine.com','nogmailspam.info',
  'nomail.pw','nomail.xl.cx','nomail2me.com','nomorespamemails.com','nonspam.eu',
  'nonspammer.de','noref.in','nospam.ze.tc','nospam4.us','nospamfor.us',
  'nospammail.net','nospamthanks.info','nothingtoseehere.ca','nowmymail.com',
  'nurfuerspam.de','nus.edu.sg','nwldx.com','objectmail.com','obobbo.com',
];

/**
 * Check if an email uses a disposable/temporary domain
 * @param {string} email
 * @returns {boolean}
 */
export function isDisposableEmail(email) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{ score: number, label: string, checks: { minLength: boolean, hasUpper: boolean, hasLower: boolean, hasNumber: boolean, hasSpecial: boolean } }}
 */
export function validatePassword(password) {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  let score, label;
  if (passed <= 2) { score = 1; label = 'Weak'; }
  else if (passed <= 3) { score = 2; label = 'Medium'; }
  else if (passed === 4) { score = 3; label = 'Strong'; }
  else { score = 4; label = 'Very Strong'; }

  // Override: if less than 8 chars, always weak
  if (!checks.minLength) { score = 1; label = 'Weak'; }

  return { score, label, checks, isValid: passed === 5 };
}
