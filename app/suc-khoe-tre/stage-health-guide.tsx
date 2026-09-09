"use client";

import { useState } from "react";
import type { HealthLifeStageId } from "./health-age-scope";

type TopicId = "daily" | "nutrition" | "sleep" | "movement" | "school-digital" | "mental-social" | "prevention";

type TopicContent = {
  title: string;
  summary: string;
  items: readonly string[];
  note?: string;
};

type StageGuide = {
  label: string;
  intro: string;
  topics: Record<TopicId, TopicContent>;
};

const TOPICS: readonly { id: TopicId; label: string }[] = [
  { id: "daily", label: "Mỗi ngày" },
  { id: "nutrition", label: "Dinh dưỡng" },
  { id: "sleep", label: "Giấc ngủ" },
  { id: "movement", label: "Vận động" },
  { id: "school-digital", label: "Học tập & số" },
  { id: "mental-social", label: "Cảm xúc & xã hội" },
  { id: "prevention", label: "Phòng ngừa" },
] as const;

const commonMovement = [
  "Ưu tiên vận động đa dạng: chơi, đi bộ/đạp xe, thể dục, bơi hoặc môn thể thao phù hợp.",
  "Từ 5–17 tuổi, WHO khuyến nghị trung bình ít nhất 60 phút/ngày hoạt động thể lực mức vừa đến mạnh trong tuần.",
  "Hoạt động mạnh và hoạt động tăng sức mạnh cơ/xương nên xuất hiện ít nhất 3 ngày/tuần nếu phù hợp khả năng.",
  "Tăng dần khối lượng vận động; đau hoặc chấn thương cần được theo dõi riêng thay vì cố tập qua đau.",
] as const;

const GUIDES: Partial<Record<HealthLifeStageId, StageGuide>> = {
  "school-age-6-8y": {
    label: "6–8 tuổi · Nền tảng sức khỏe học đường",
    intro: "Tập trung vào nhịp sinh hoạt ổn định, chơi vận động, kỹ năng học đường, răng miệng, an toàn và cảm xúc.",
    topics: {
      daily: { title: "Nền nếp mỗi ngày", summary: "Biến chăm sóc sức khỏe thành thói quen dễ làm, không thành bảng điểm.", items: ["Ăn sáng hoặc có bữa đầu ngày phù hợp lịch gia đình.", "Uống nước đều trong ngày; mang bình nước khi đi học nếu trường cho phép.", "Đánh răng sáng/tối với kem fluoride phù hợp và người lớn tiếp tục kiểm tra kỹ thuật.", "Có thời gian chơi, vận động, nghỉ và trò chuyện với gia đình."] },
      nutrition: { title: "Ăn đa dạng, không ép cân", summary: "WHO nhấn mạnh đủ, cân bằng, điều độ, đa dạng và an toàn thực phẩm.", items: ["Luân phiên rau, trái cây, nguồn đạm, ngũ cốc/tinh bột và sữa hoặc thực phẩm tương đương.", "Ưu tiên thực phẩm ít chế biến; hạn chế biến đồ uống ngọt và đồ ăn siêu chế biến thành thói quen hằng ngày.", "Không dùng cân nặng hoặc lượng ăn để thưởng/phạt trẻ.", "Nếu có dị ứng, bệnh nền hoặc tăng trưởng bất thường, mục tiêu ăn uống cần theo tư vấn riêng."] },
      sleep: { title: "Ngủ 9–12 giờ/24 giờ", summary: "AASM khuyến nghị trẻ 6–12 tuổi ngủ 9–12 giờ thường xuyên.", items: ["Giữ giờ đi ngủ và thức dậy tương đối ổn định.", "Chuẩn bị môi trường ngủ yên, tối và mát vừa phải.", "Giảm hoạt động kích thích và màn hình sát giờ ngủ.", "Ngáy to thường xuyên, ngưng thở khi ngủ hoặc buồn ngủ ban ngày kéo dài cần được trao đổi với nhân viên y tế."], note: "Không dùng một đêm ngủ ít để tự kết luận rối loạn giấc ngủ." },
      movement: { title: "Chơi và vận động mỗi ngày", summary: "Mục tiêu là sức khỏe và niềm vui vận động, không phải luyện hình thể.", items: commonMovement },
      "school-digital": { title: "Mắt, tư thế và môi trường số", summary: "Thiết bị số là công cụ; cần cân bằng với ngủ, vận động, học và giao tiếp trực tiếp.", items: ["Có các khoảng nghỉ mắt và đổi tư thế khi học/đọc lâu.", "Bàn ghế, ánh sáng và khoảng cách nhìn cần phù hợp cơ thể trẻ.", "Thiết lập quy tắc gia đình rõ ràng về thiết bị, nội dung, người lạ và thông tin cá nhân.", "Đau mắt, nhìn mờ, nheo mắt hoặc đau đầu lặp lại khi học cần được kiểm tra phù hợp."] },
      "mental-social": { title: "Cảm xúc và kỹ năng xã hội", summary: "Trẻ cần môi trường an toàn, được lắng nghe và có người lớn tin cậy.", items: ["Gọi tên cảm xúc và tập cách xin giúp đỡ.", "Quan sát thay đổi kéo dài về vui chơi, đi học, ngủ, ăn hoặc giao tiếp.", "Dạy cách phản ứng khi bị bắt nạt, đe dọa hoặc chạm vào cơ thể khiến trẻ khó chịu.", "Tránh dán nhãn trẻ bằng một lần nổi giận, mất tập trung hoặc buồn bã."] },
      prevention: { title: "Phòng ngừa & khám định kỳ", summary: "Theo dõi dựa trên hồ sơ thật và hướng dẫn quốc gia/cơ sở y tế phù hợp.", items: ["Giữ hồ sơ tiêm chủng, dị ứng, thuốc và các lần khám quan trọng.", "Duy trì chăm sóc răng miệng và khám nha khoa theo nguy cơ/tư vấn nha sĩ.", "Theo dõi thị lực, thính lực và các vấn đề học đường khi có dấu hiệu.", "Dạy an toàn nước, giao thông, mũ bảo hiểm và cách gọi người lớn khi khẩn cấp."], note: "Ứng dụng không tự áp lịch tiêm của một quốc gia khác cho hồ sơ Việt Nam." },
    },
  },
  foundation: {
    label: "9–10 tuổi · Nền tảng trước dậy thì",
    intro: "Giữ nền ăn–ngủ–vận động ổn định và bắt đầu chuẩn bị kiến thức thay đổi cơ thể theo ngôn ngữ phù hợp tuổi.",
    topics: {
      daily: { title: "Tự chăm sóc có hướng dẫn", summary: "Tăng dần trách nhiệm nhưng vẫn cần người lớn kiểm tra và hỗ trợ.", items: ["Tự chuẩn bị bình nước, đồ dùng vệ sinh và nhắc lịch đơn giản.", "Duy trì vệ sinh răng miệng, tắm/rửa và thay đồ phù hợp hoạt động.", "Biết tên thuốc/dị ứng quan trọng nếu có nhưng không tự quyết định dùng thuốc.", "Biết người lớn tin cậy ở nhà và ở trường để tìm trợ giúp."] },
      nutrition: { title: "Ăn đa dạng để hỗ trợ tăng trưởng", summary: "Không biến dinh dưỡng thành calorie tracker hoặc chương trình giảm cân.", items: ["Duy trì các bữa chính đều và ưu tiên không bỏ bữa sáng khi có thể.", "Có rau/trái cây, nguồn đạm, ngũ cốc/tinh bột và nguồn canxi phù hợp trong khẩu phần đa dạng.", "Ưu tiên nước; hạn chế đồ uống nhiều đường thành thói quen thường ngày.", "Không khen/chê ngoại hình hoặc ép ăn dựa trên cân nặng."], note: "WHO Healthy diet: đủ, cân bằng, điều độ, đa dạng và an toàn." },
      sleep: { title: "Ngủ 9–12 giờ/24 giờ", summary: "Nhóm 9–10 tuổi nằm trong khuyến nghị AASM 6–12 tuổi.", items: ["Giữ giờ ngủ tương đối đều cả ngày học và cuối tuần.", "Sắp xếp bài tập, vận động và màn hình để không lấn giờ ngủ.", "Theo dõi ngáy to, ngưng thở, khó ngủ kéo dài hoặc buồn ngủ học đường.", "Dùng nhật ký để xem xu hướng nhiều ngày thay vì phán đoán từ một đêm."] },
      movement: { title: "Vận động vì sức khỏe", summary: "WHO 5–17 tuổi: trung bình ≥60 phút/ngày mức vừa–mạnh trong tuần.", items: commonMovement },
      "school-digital": { title: "Học đường & sức khỏe số", summary: "Cân bằng tập trung học, nghỉ mắt, vận động và thời gian trực tuyến.", items: ["Nghỉ ngắn, đổi tư thế và nhìn xa định kỳ khi học lâu.", "Theo dõi khó nhìn bảng, nheo mắt, đau đầu hoặc giảm tập trung có tính lặp lại.", "Thảo luận quy tắc an toàn trực tuyến, quyền riêng tư và nội dung không phù hợp.", "Không dùng màn hình như phần thưởng duy nhất hoặc công cụ xoa dịu mọi cảm xúc."] },
      "mental-social": { title: "Cảm xúc, bạn bè & ranh giới", summary: "Chuẩn bị kỹ năng trước giai đoạn biến đổi mạnh hơn của tuổi dậy thì.", items: ["Khuyến khích trẻ nói về vui, buồn, lo, xấu hổ và áp lực học tập.", "Có ít nhất một người lớn tin cậy trẻ có thể tìm đến.", "Dạy ranh giới cơ thể, quyền nói không và cách báo lại tình huống không an toàn.", "Theo dõi bắt nạt trực tiếp hoặc trực tuyến mà không đổ lỗi cho trẻ."] },
      prevention: { title: "Phòng ngừa & hồ sơ", summary: "Giữ hồ sơ cơ bản đủ để theo dõi dài hạn.", items: ["Cập nhật chiều cao/cân nặng theo mốc hợp lý và nhìn xu hướng dài hạn.", "Giữ lịch sử tiêm chủng, dị ứng, thuốc, bệnh nền và lần khám quan trọng.", "Duy trì nha khoa, mắt/tai và khám định kỳ theo hướng dẫn phù hợp.", "Rà soát thông tin liên lạc khẩn cấp và kỹ năng an toàn nước/giao thông."], note: "Không suy diễn chẩn đoán từ một số đo đơn lẻ." },
    },
  },
  preteen: {
    label: "11–12 tuổi · Tiền dậy thì",
    intro: "Tăng trưởng nhanh hơn, thay đổi cơ thể rõ hơn và nhu cầu riêng tư bắt đầu tăng; nội dung cần bình tĩnh, không phán xét.",
    topics: {
      daily: { title: "Tăng dần tự quản", summary: "Cho trẻ tham gia vào quyết định sức khỏe phù hợp khả năng.", items: ["Biết dị ứng, thuốc đang dùng và bệnh nền quan trọng của mình nếu có.", "Tự chuẩn bị đồ vệ sinh cá nhân và theo dõi lịch đơn giản với người lớn hỗ trợ.", "Biết hỏi khi không hiểu hướng dẫn y tế.", "Tôn trọng không gian riêng tư khi trẻ thay đồ, vệ sinh và trao đổi vấn đề nhạy cảm."] },
      nutrition: { title: "Dinh dưỡng trong giai đoạn tăng trưởng", summary: "Chú ý đa dạng, nguồn đạm, sắt, canxi và bữa ăn đều; không siết cân.", items: ["Giữ nhịp bữa ăn tương đối đều trong lịch học.", "Luân phiên nguồn đạm và thực phẩm giàu sắt trong khẩu phần gia đình.", "Duy trì nguồn canxi phù hợp nếu sử dụng được.", "Nếu xuất hiện sợ tăng cân, bỏ bữa, ăn bù/ăn vô kiểm soát hoặc ám ảnh hình thể, nên trao đổi sớm với người lớn tin cậy/chuyên môn phù hợp."], note: "Không tự dùng thực phẩm bổ sung, thuốc hoặc chế độ ăn cực đoan để thay đổi cân nặng." },
      sleep: { title: "Ngủ 9–12 giờ/24 giờ", summary: "12 tuổi vẫn thuộc nhóm AASM 6–12 tuổi.", items: ["Ưu tiên giờ ngủ trước lịch học và hoạt động ngoại khóa.", "Tránh để mạng xã hội/game kéo dài vào giờ ngủ.", "Nhật ký ngủ nên mô tả giờ ngủ/thức và chất lượng, không tạo điểm số sức khỏe.", "Khó ngủ kéo dài, ngáy/ngưng thở hoặc buồn ngủ ban ngày rõ cần được đánh giá phù hợp."] },
      movement: { title: "Vận động trong tuổi tăng trưởng", summary: "Giữ đa dạng vận động, kỹ thuật và phục hồi; tránh áp lực thành tích quá mức.", items: commonMovement },
      "school-digital": { title: "Học tập, chú ý & không gian số", summary: "Theo dõi chức năng học đường chứ không tự gắn nhãn ADHD/rối loạn học tập.", items: ["Quan sát xu hướng tập trung, mệt mỏi, đi học và hoàn thành nhiệm vụ theo thời gian.", "Tách khó khăn do thiếu ngủ/stress khỏi kết luận bệnh lý vội vàng.", "Thảo luận cyberbullying, lừa đảo, chia sẻ ảnh/thông tin riêng tư và nội dung gây khó chịu.", "Thiết lập thời gian không thiết bị cho ngủ, vận động và giao tiếp trực tiếp."] },
      "mental-social": { title: "Dậy thì, cảm xúc & bạn bè", summary: "WHO coi tuổi vị thành niên là giai đoạn phát triển thể chất, nhận thức và tâm lý-xã hội nhanh.", items: ["Giải thích thay đổi cơ thể bằng từ ngữ chính xác, tôn trọng và phù hợp tuổi.", "Bình thường hóa việc hỏi về dậy thì nhưng không ép trẻ chia sẻ trước người khác.", "Theo dõi stress học tập, xung đột bạn bè và bắt nạt.", "Nếu trẻ buồn/lo kéo dài, thu mình rõ, giảm chức năng hoặc nói đến tự làm hại bản thân, cần tìm hỗ trợ chuyên môn phù hợp ngay."], note: "Không dùng một điểm check-in để chẩn đoán rối loạn tâm thần." },
      prevention: { title: "Phòng ngừa & riêng tư", summary: "Thiết bị được duyệt không đồng nghĩa mọi người trên thiết bị được xem dữ liệu nhạy cảm.", items: ["Rà soát tiêm chủng và khám định kỳ theo hồ sơ/quốc gia.", "Theo dõi răng miệng, thị lực, thính lực và vấn đề da nếu có.", "Dạy an toàn thể thao, nước, giao thông và cách tìm hỗ trợ.", "Cấu hình quyền riêng tư hồ sơ trước khi lưu nội dung dậy thì/tinh thần nhạy cảm."], note: "Profile Privacy và Secure Vault vẫn là lớp bắt buộc cho dữ liệu nhạy cảm." },
    },
  },
  "early-adolescent": {
    label: "13–15 tuổi · Vị thành niên sớm",
    intro: "Ưu tiên sức khỏe tinh thần, ngủ, dinh dưỡng không ám ảnh hình thể, an toàn số, quan hệ và tăng dần năng lực tự chăm sóc.",
    topics: {
      daily: { title: "Tự quản có hỗ trợ", summary: "Tập tự theo dõi nhưng không để trẻ một mình với quyết định y khoa phức tạp.", items: ["Biết thuốc, dị ứng và bệnh nền quan trọng của mình nếu có.", "Biết cách liên hệ người chăm sóc/cơ sở y tế khi cần.", "Tự đặt nhắc việc cho thói quen và lịch hẹn với người lớn hỗ trợ khi cần.", "Tôn trọng quyền riêng tư phù hợp và giải thích rõ khi thông tin cần được chia sẻ vì an toàn."] },
      nutrition: { title: "Ăn uống & hình ảnh cơ thể", summary: "Tập trung vào đủ, cân bằng và đa dạng; tránh biến app thành công cụ siết cân.", items: ["Giữ bữa chính ổn định trong lịch học và hoạt động.", "Duy trì nguồn đạm, sắt, canxi, rau/trái cây và nước trong khẩu phần đa dạng.", "Không khuyến khích nhịn ăn, detox, thuốc giảm cân hoặc sản phẩm tăng cơ không rõ chỉ định.", "Theo dõi dấu hiệu lo âu hình thể/hành vi ăn uống bất thường theo hướng tìm hỗ trợ, không chấm điểm."], note: "WHO Healthy diet nhấn mạnh đủ, cân bằng, điều độ, đa dạng và an toàn." },
      sleep: { title: "Ngủ 8–10 giờ/24 giờ", summary: "AASM khuyến nghị thanh thiếu niên 13–18 tuổi ngủ 8–10 giờ thường xuyên.", items: ["Giữ giờ ngủ đủ dù lịch học, thi cử và mạng xã hội tăng.", "Giảm caffeine/nước tăng lực và màn hình sát giờ ngủ nếu chúng làm khó ngủ.", "Theo dõi xu hướng thiếu ngủ đi cùng mệt mỏi, cáu gắt, giảm tập trung.", "Không dùng thuốc ngủ hoặc chất hỗ trợ ngủ khi chưa có hướng dẫn chuyên môn phù hợp."] },
      movement: { title: "Vận động, thể thao & chấn thương", summary: "WHO 5–17 tuổi: trung bình ≥60 phút/ngày mức vừa–mạnh; chất lượng và an toàn quan trọng hơn thành tích.", items: commonMovement },
      "school-digital": { title: "Áp lực học & môi trường số", summary: "Công nghệ có lợi ích nhưng cũng có thể làm tăng tiếp xúc với cyberbullying, nội dung có hại và hành vi gây nghiện.", items: ["Theo dõi cân bằng giữa học, ngủ, vận động, bạn bè và thiết bị.", "Không tự gắn nhãn nghiện chỉ từ số giờ màn hình; xem tác động lên chức năng.", "Có kế hoạch xử lý bắt nạt, quấy rối, tống tiền ảnh hoặc nội dung gây sợ hãi.", "Bảo vệ mật khẩu, vị trí, ảnh riêng tư và thông tin nhận dạng cá nhân."] },
      "mental-social": { title: "Sức khỏe tinh thần & quan hệ", summary: "WHO nhấn mạnh môi trường an toàn, kỹ năng sống, hỗ trợ tâm lý-xã hội và dịch vụ phù hợp thanh thiếu niên.", items: ["Check-in cảm xúc/stress nên dùng để mở cuộc trò chuyện, không để dán nhãn.", "Theo dõi thay đổi kéo dài về học, ngủ, ăn, giao tiếp, hứng thú và chức năng.", "Dạy ranh giới, đồng thuận, quan hệ tôn trọng và cách tìm người lớn/dịch vụ hỗ trợ.", "Ý nghĩ tự hại/tự sát, bạo lực, lạm dụng hoặc mất an toàn cần được xử lý như vấn đề an toàn thực sự và tìm trợ giúp phù hợp ngay."], note: "Dữ liệu tinh thần và quan hệ là highly-sensitive, cần Profile Privacy + Secure Vault." },
      prevention: { title: "Phòng ngừa & hành vi nguy cơ", summary: "Mục tiêu là kiến thức, kỹ năng và tiếp cận hỗ trợ, không phải giám sát trừng phạt.", items: ["Cập nhật khám/tiêm theo hồ sơ và hướng dẫn phù hợp quốc gia.", "Nói rõ nguy cơ nicotine/vape, rượu bia và chất gây nghiện bằng ngôn ngữ không phán xét.", "Duy trì nha khoa, mắt/tai, da và chăm sóc cơ xương khi cần.", "Biết nơi tìm chăm sóc thường quy, khẩn cấp và hỗ trợ tâm lý."], note: "Không bật screening có điểm số nếu chưa có công cụ, bản quyền, lứa tuổi và đường xử trí được kiểm định." },
    },
  },
  "late-adolescent": {
    label: "16–18 tuổi · Chuẩn bị tự quản lý / đại học",
    intro: "Chuyển dần từ phụ huynh quản lý sang người trẻ hiểu hồ sơ, tự đặt lịch, bảo vệ riêng tư và biết tìm chăm sóc khi sống xa nhà.",
    topics: {
      daily: { title: "Năng lực tự quản lý sức khỏe", summary: "Thực hành các kỹ năng sẽ cần khi học tập hoặc sống xa gia đình.", items: ["Biết tên bệnh nền quan trọng, thuốc, liều được kê và dị ứng của mình.", "Biết cách đặt lịch, chuẩn bị câu hỏi khi khám và lưu tài liệu quan trọng.", "Có thẻ thông tin khẩn cấp và liên hệ tin cậy.", "Biết khi nào có thể tự xử lý việc thường ngày và khi nào cần cơ sở y tế."], note: "Ứng dụng ghi lại thông tin đã có, không tự thay đổi thuốc hoặc kế hoạch điều trị." },
      nutrition: { title: "Ăn uống khi tự lập", summary: "Chuẩn bị lựa chọn thực tế khi lịch học, ký túc xá hoặc di chuyển làm thay đổi bữa ăn.", items: ["Lập phương án bữa chính và lựa chọn dự phòng khi lịch học dài.", "Ưu tiên nước, thực phẩm đa dạng và an toàn thực phẩm.", "Biết dị ứng và cách đọc thông tin thực phẩm khi cần.", "Tránh thuốc/sản phẩm tăng cơ, giảm cân hoặc hormone không có chỉ định chuyên môn phù hợp."], note: "Không dùng cân nặng làm KPI của ứng dụng." },
      sleep: { title: "Ngủ 8–10 giờ/24 giờ", summary: "Lịch thi, học khuya và thiết bị số dễ làm mất ngủ tích lũy.", items: ["Theo dõi giờ ngủ/thức và chức năng ban ngày trong xu hướng nhiều ngày.", "Bảo vệ thời gian ngủ trước các đợt học/thi kéo dài.", "Hạn chế caffeine/nước tăng lực muộn nếu ảnh hưởng giấc ngủ.", "Mất ngủ kéo dài hoặc buồn ngủ quá mức cần được đánh giá phù hợp."] },
      movement: { title: "Vận động & tự quản chấn thương", summary: "Tiếp tục vận động đều, chú ý kỹ thuật, phục hồi và chấn thương thể thao.", items: commonMovement },
      "school-digital": { title: "Đại học, công việc & sức khỏe số", summary: "Chuẩn bị môi trường học tập mới mà không đánh đổi ngủ, vận động và an toàn số.", items: ["Tạo nhịp học–nghỉ bền vững và không dựa hoàn toàn vào thức khuya.", "Bảo vệ tài khoản, hồ sơ y tế, giấy tờ và vị trí cá nhân.", "Nhận biết cyberbullying, lừa đảo, tống tiền và nội dung có hại.", "Giữ kết nối trực tiếp, hoạt động thể chất và thời gian không màn hình."], note: "WHO 2026 nhấn mạnh môi trường số vừa có cơ hội vừa có rủi ro sức khỏe cho người trẻ." },
      "mental-social": { title: "Tinh thần, quan hệ & mạng lưới hỗ trợ", summary: "Tự lập không đồng nghĩa phải tự giải quyết mọi vấn đề.", items: ["Biết người/địa điểm có thể tìm đến khi stress, mất an toàn hoặc khủng hoảng.", "Theo dõi thay đổi chức năng học, ngủ, ăn, quan hệ và hứng thú theo thời gian.", "Hiểu ranh giới, đồng thuận và quyền riêng tư trong quan hệ.", "Ý nghĩ tự hại/tự sát hoặc bạo lực cần được ưu tiên an toàn và tìm trợ giúp ngay."], note: "Dữ liệu tinh thần/quan hệ phải private-by-default theo policy của hồ sơ." },
      prevention: { title: "Health passport trước khi sống xa nhà", summary: "Gom những thông tin cần thiết để không phụ thuộc hoàn toàn vào trí nhớ hoặc phụ huynh.", items: ["Chuẩn bị danh sách thuốc/dị ứng/bệnh nền và thông tin bác sĩ/cơ sở y tế nếu có.", "Giữ bản sao hồ sơ tiêm, đơn thuốc, xét nghiệm/hình ảnh quan trọng theo nhu cầu.", "Biết nơi khám thường quy, nha khoa, cấp cứu và hỗ trợ tinh thần tại nơi học/sống.", "Rà soát quyền chia sẻ dữ liệu và người được phép hỗ trợ hồ sơ."], note: "Site Quản trị chỉ quản lý thiết bị/quyền, không nhận nội dung health passport." },
    },
  },
};

export default function StageHealthGuide({ stageId }: { stageId: HealthLifeStageId }) {
  const guide = GUIDES[stageId];
  const [topic, setTopic] = useState<TopicId>("daily");
  if (!guide) return null;
  const content = guide.topics[topic];

  return <section className="shg" aria-label={`Hướng dẫn sức khỏe ${guide.label}`}>
    <header className="shg-head"><span className="hf-kicker">Nội dung theo giai đoạn</span><h4>{guide.label}</h4><p>{guide.intro}</p></header>
    <div className="shg-tabs" role="tablist" aria-label="Chọn chủ đề sức khỏe">
      {TOPICS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={topic === item.id} className={topic === item.id ? "is-active" : ""} onClick={() => setTopic(item.id)}>{item.label}</button>)}
    </div>
    <article className="shg-panel" role="tabpanel">
      <span className="hf-kicker">{TOPICS.find((item) => item.id === topic)?.label}</span>
      <h4>{content.title}</h4>
      <p>{content.summary}</p>
      <ul>{content.items.map((item) => <li key={item}>{item}</li>)}</ul>
      {content.note ? <div className="shg-note">{content.note}</div> : null}
    </article>
    <footer className="shg-source">Nền tảng nội dung: WHO Healthy diet (2026), WHO physical activity 5–17, WHO adolescent health/mental-health guidance và AASM pediatric sleep recommendations. Các lịch/chỉ định cá nhân vẫn phải theo hồ sơ và chuyên môn phù hợp.</footer>
  </section>;
}

export const STAGE_HEALTH_GUIDE_GUARDRAILS = {
  noHealthScore: true,
  noWeightLossGamification: true,
  noGeneratedDiagnosis: true,
  noMedicationChange: true,
  sensitiveTopicsRespectProfilePrivacy: true,
} as const;
