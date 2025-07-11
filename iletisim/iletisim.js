function sendToWhatsApp() {
    // Form elemanlarını al
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;

    // Telefon numarasını ve Instagram linkini güncelledim
    const whatsappNumber = '905320632554'; // Mesajın gönderileceği WhatsApp numarası
    const instagramLink = 'https://www.instagram.com/pi_er_aluminyum?utm_source=ig_web_button_share_sheet&igsh=MW95ZzN3aDU2MHIyYg=='; // Instagram linki

    // Form doğrulamasını yap
    if (!name || !email || !subject || !message) {
        alert('Lütfen adınız soyadınız, e-posta, konu ve mesaj alanlarını doldurunuz.');
        return;
    }

    // WhatsApp mesaj metnini oluştur
    let whatsappMessage = `*Yeni İletişim Formu Mesajı:*\n\n`;
    whatsappMessage += `*Ad Soyad:* ${name}\n`;
    whatsappMessage += `*E-posta:* ${email}\n`;
    if (phone) {
        whatsappMessage += `*Telefon:* ${phone}\n`;
    }
    whatsappMessage += `*Konu:* ${subject}\n`;
    whatsappMessage += `*Mesaj:* ${message}\n\n`;
    whatsappMessage += `Bu mesaj web sitenizdeki iletişim formundan gönderilmiştir.`;

    // WhatsApp URL'sini oluştur
    // Metni URL'ye uygun hale getiriyoruz
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Kullanıcıyı WhatsApp'a yönlendir
    window.open(whatsappUrl, '_blank');

    // İsteğe bağlı: Formu temizle veya bir onay mesajı göster
    // document.getElementById('contactForm').reset();
    // alert('Mesajınız WhatsApp üzerinden gönderilmek üzere hazırlandı. Lütfen WhatsApp ekranında gönder butonuna basınız.');
}