/* SFX gate input: where the voice track (out/vo/vo.wav) is actually sounding, from its energy (10 ms frames within 40 dB of the loudest), as [start, end]. */
window.VAD = [[0.21, 1.36], [1.47, 3.58], [4.22, 6.1], [6.48, 9.38], [9.82, 10.41], [10.57, 11.15], [11.93, 14.51], [14.9, 16.92], [17.61, 18.87], [19.08, 20.92], [21.33, 21.91], [22.01, 24.49], [25.33, 27.67]];
