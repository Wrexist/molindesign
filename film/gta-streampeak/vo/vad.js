/* SFX gate input: where the voice track (out/vo/vo.wav) is actually sounding, from its energy (10 ms frames within 40 dB of the loudest), as [start, end]. */
window.VAD = [[0.24, 1.08], [1.26, 2.98], [3.85, 5.44], [6.24, 6.44], [6.69, 7.41], [7.79, 8.94], [9.28, 10.4], [10.72, 11.88], [12.02, 12.9], [13.56, 16.49], [17.85, 19.08], [19.63, 21.91], [22.65, 24.28], [25.11, 26.19], [26.32, 27.26]];
