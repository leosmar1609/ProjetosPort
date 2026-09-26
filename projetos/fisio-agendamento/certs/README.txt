kaspersky-root.pem

Essa máquina tem o Kaspersky com a inspeção de tráfego HTTPS ativada — ele intercepta as conexões
e reassina com um certificado próprio, e o Node.js (diferente do navegador) não confia nesse
certificado por padrão. Sem isso, qualquer chamada HTTPS feita pelo servidor (ex: enviar e-mail
pela Resend) falha com o erro "self-signed certificate in certificate chain".

Esse arquivo é a raiz do certificado do Kaspersky, exportada uma vez, pra o Node passar a confiar
nela. É usada automaticamente pelo "npm run dev" (variável NODE_EXTRA_CA_CERTS no package.json).

Não é nada secreto — é só a chave pública da raiz do antivírus, não tem informação sensível.

Se um dia parar de funcionar de novo com o mesmo erro (ex: depois de reinstalar o Kaspersky, que
pode gerar uma raiz nova), é só rodar de novo:

  node -e "const tls=require('tls'),fs=require('fs');const s=tls.connect(443,'api.resend.com',{servername:'api.resend.com',rejectUnauthorized:false},()=>{let c=s.getPeerCertificate(true);while(c.issuerCertificate&&c.issuerCertificate!==c)c=c.issuerCertificate;const b64=c.raw.toString('base64').match(/.{1,64}/g).join('\n');fs.writeFileSync('certs/kaspersky-root.pem','-----BEGIN CERTIFICATE-----\n'+b64+'\n-----END CERTIFICATE-----\n');console.log('salvo');s.end();});"

Rodando em outra máquina sem esse antivírus, esse arquivo simplesmente não é usado pra nada (não
atrapalha, só fica sem efeito).
